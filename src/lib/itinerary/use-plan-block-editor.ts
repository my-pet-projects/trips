import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useInvalidateItinerary } from "~/lib/itinerary/use-invalidate-itinerary";
import { getTrpcErrorMessage } from "~/lib/trpc-error-message";
import { api } from "~/trpc/react";
import type {
  AttractionDetail,
  PlanBlock,
  PlanBlockFieldPatch,
  Trip,
} from "~/types";

const AUTO_SAVE_DELAY_MS = 500;

function toPlanBlocksUpdateInput(tripId: number, blocks: PlanBlock[]) {
  return {
    tripId,
    blocks: blocks
      .filter((block) => block.id > 0)
      .map((block) => ({
        id: block.id,
        name: block.name,
        blockNumber: block.blockNumber,
        pinnedStartDate: block.pinnedStartDate,
        pinnedEndDate: block.pinnedEndDate,
        attractions: block.attractions.map((attraction, index) => ({
          attractionId: attraction.id,
          order: index + 1,
        })),
      })),
  };
}

type SerializedPlanBlock = {
  id: number;
  name: string;
  blockNumber: number;
  pinnedStartDate: Date | null;
  pinnedEndDate: Date | null;
  attractionIds: number[];
};

function toSerializedBlock(block: {
  id: number;
  name: string;
  blockNumber: number;
  pinnedStartDate: Date | null;
  pinnedEndDate: Date | null;
  attractions: Array<{ id: number } | { attractionId: number }>;
}): SerializedPlanBlock {
  return {
    id: block.id,
    name: block.name,
    blockNumber: block.blockNumber,
    pinnedStartDate: block.pinnedStartDate,
    pinnedEndDate: block.pinnedEndDate,
    attractionIds: block.attractions.map((attraction) =>
      "id" in attraction ? attraction.id : attraction.attractionId,
    ),
  };
}

function serializeSavedBlocks(
  blocks: Array<{
    id: number;
    name: string;
    blockNumber: number;
    pinnedStartDate: Date | null;
    pinnedEndDate: Date | null;
    attractions: Array<{ attractionId: number }>;
  }>,
): string {
  return JSON.stringify(blocks.map((block) => toSerializedBlock(block)));
}

function serializePlanBlocks(blocks: PlanBlock[]): string {
  return JSON.stringify(
    blocks
      .filter((block) => block.id > 0)
      .map((block) =>
        toSerializedBlock({
          ...block,
          attractions: block.attractions,
        }),
      ),
  );
}

export function usePlanBlockEditor(trip: Trip) {
  const tripId = trip.id;
  const utils = api.useUtils();
  const invalidateItinerary = useInvalidateItinerary();

  const [planBlocks, setPlanBlocks] = useState<PlanBlock[]>(
    () => trip.planBlocks,
  );
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(
    () => trip.planBlocks[0]?.id ?? null,
  );
  const [blockBeingRemoved, setBlockBeingRemoved] = useState<number | null>(
    null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const blockIdsKey = useMemo(
    () => planBlocks.map((block) => block.id).join(","),
    [planBlocks],
  );

  useEffect(() => {
    setSelectedBlockId((prev) =>
      prev !== null && planBlocks.some((block) => block.id === prev)
        ? prev
        : (planBlocks[0]?.id ?? null),
    );
  }, [blockIdsKey, planBlocks]);

  const lastSavedSnapshot = useRef(serializePlanBlocks(planBlocks));
  const skipNextSave = useRef(true);
  const prevTripIdRef = useRef(tripId);
  const cancelledTempIds = useRef(new Set<number>());
  const silentDeleteIds = useRef(new Set<number>());
  const planBlocksRef = useRef(planBlocks);
  const saveErrorRef = useRef<string | null>(null);
  planBlocksRef.current = planBlocks;

  const { mutate: savePlanBlocks, isPending: isSavingBlocks } =
    api.itinerary.updatePlanBlocks.useMutation({
      onSuccess: (_, variables) => {
        lastSavedSnapshot.current = serializeSavedBlocks(
          variables.blocks as Array<{
            id: number;
            name: string;
            blockNumber: number;
            pinnedStartDate: Date | null;
            pinnedEndDate: Date | null;
            attractions: Array<{ attractionId: number }>;
          }>,
        );
        saveErrorRef.current = null;
        setSaveError(null);
        invalidateItinerary();
      },
      onError: (err) => {
        const message = getTrpcErrorMessage(err);
        if (!saveErrorRef.current) {
          toast.error("Could not save changes", { description: message });
        }
        saveErrorRef.current = message;
        setSaveError(message);
      },
    });

  const deleteBlock = api.itinerary.deletePlanBlock.useMutation({
    onSuccess: (_, variables) => {
      setPlanBlocks((prevBlocks) => {
        const filtered = prevBlocks.filter((b) => b.id !== variables.blockId);
        return filtered.map((b, i) => ({ ...b, blockNumber: i + 1 }));
      });

      const isSilent = silentDeleteIds.current.delete(variables.blockId);
      if (!isSilent) {
        toast.success("Plan removed");
      }
      invalidateItinerary();
    },
    onError: (err) => {
      toast.error("Failed to remove plan", {
        description: getTrpcErrorMessage(err),
      });
    },
    onSettled: () => setBlockBeingRemoved(null),
  });

  const createBlock = api.itinerary.createPlanBlock.useMutation({
    onMutate: async (newBlockData) => {
      await utils.trip.getWithItinerary.cancel();

      const tempId = -Date.now();
      setPlanBlocks((prev) => [
        ...prev,
        {
          id: tempId,
          name: newBlockData.name,
          blockNumber: newBlockData.blockNumber,
          pinnedStartDate: null,
          pinnedEndDate: null,
          attractions: [],
        },
      ]);
      setSelectedBlockId(tempId);
      return { tempId };
    },
    onSuccess: (newBlock, _, context) => {
      const tempId = context?.tempId;
      if (tempId === undefined) return;

      const wasCancelled = cancelledTempIds.current.delete(tempId);
      const tempStillPresent = planBlocksRef.current.some(
        (block) => block.id === tempId,
      );

      if (wasCancelled || !tempStillPresent) {
        silentDeleteIds.current.add(newBlock.id);
        deleteBlock.mutate({ blockId: newBlock.id });
        return;
      }

      setPlanBlocks((prev) =>
        prev.map((block) =>
          block.id === tempId ? { ...block, id: newBlock.id } : block,
        ),
      );
      setSelectedBlockId(newBlock.id);
      toast.success("Plan added");
      invalidateItinerary();
    },
    onError: (err, _, context) => {
      if (context?.tempId) {
        cancelledTempIds.current.delete(context.tempId);
        setPlanBlocks((prev) =>
          prev.filter((block) => block.id !== context.tempId),
        );
      }
      toast.error("Failed to add plan", {
        description: getTrpcErrorMessage(err),
      });
    },
  });

  useEffect(() => {
    if (prevTripIdRef.current === tripId) return;
    prevTripIdRef.current = tripId;

    const serverBlocks = trip.planBlocks;
    setPlanBlocks(serverBlocks);
    skipNextSave.current = true;
    lastSavedSnapshot.current = serializePlanBlocks(serverBlocks);
  }, [tripId, trip]);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    if (planBlocks.some((block) => block.id < 0 || !block.name.trim())) {
      return;
    }

    const snapshot = serializePlanBlocks(planBlocks);
    if (snapshot === lastSavedSnapshot.current) {
      return;
    }

    const timeout = setTimeout(() => {
      savePlanBlocks(toPlanBlocksUpdateInput(tripId, planBlocks));
    }, AUTO_SAVE_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [planBlocks, tripId, savePlanBlocks]);

  const addBlock = useCallback(() => {
    if (createBlock.isPending) return;

    const newBlockNumber = planBlocks.length + 1;
    createBlock.mutate({
      tripId,
      name: `Plan ${newBlockNumber}`,
      blockNumber: newBlockNumber,
    });
  }, [tripId, planBlocks.length, createBlock]);

  const removeBlock = useCallback(
    (blockId: number) => {
      if (blockId < 0) {
        cancelledTempIds.current.add(blockId);
        setPlanBlocks((prev) => prev.filter((b) => b.id !== blockId));
        return;
      }

      setBlockBeingRemoved(blockId);
      deleteBlock.mutate({ blockId });
    },
    [deleteBlock],
  );

  const retrySave = useCallback(() => {
    if (planBlocks.some((block) => block.id < 0 || !block.name.trim())) {
      return;
    }
    savePlanBlocks(toPlanBlocksUpdateInput(tripId, planBlocks));
  }, [planBlocks, tripId, savePlanBlocks]);

  const addAttractionToBlock = useCallback(
    (blockId: number | null, attraction: AttractionDetail): boolean => {
      if (!blockId) {
        toast.error("No plan selected", {
          description: "Please select a plan to add attractions.",
        });
        return false;
      }

      const existingBlock = planBlocks.find((block) =>
        block.attractions.some((a) => a.id === attraction.id),
      );
      if (existingBlock) {
        toast.info("Attraction already added", {
          description: `This attraction is already in ${existingBlock.name}.`,
        });
        return false;
      }

      setPlanBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId
            ? { ...b, attractions: [...b.attractions, attraction] }
            : b,
        ),
      );

      toast.success("Attraction added", {
        description: `${attraction.name} has been added.`,
      });
      return true;
    },
    [planBlocks],
  );

  const removeAttraction = useCallback(
    (blockId: number, attractionId: number) => {
      setPlanBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId
            ? {
                ...b,
                attractions: b.attractions.filter((a) => a.id !== attractionId),
              }
            : b,
        ),
      );
    },
    [],
  );

  const reorderAttractions = useCallback(
    (blockId: number, reorderedAttractions: PlanBlock["attractions"]) => {
      setPlanBlocks((prev) =>
        prev.map((b) =>
          b.id === blockId ? { ...b, attractions: reorderedAttractions } : b,
        ),
      );
    },
    [],
  );

  const moveBlock = useCallback((blockId: number, direction: "up" | "down") => {
    setPlanBlocks((prevBlocks) => {
      const newBlocks = [...prevBlocks];
      const index = newBlocks.findIndex((b) => b.id === blockId);
      if (index === -1) return prevBlocks;

      const undatedIndices = newBlocks
        .map((block, blockIndex) => (block.pinnedStartDate ? -1 : blockIndex))
        .filter((blockIndex) => blockIndex >= 0);
      const undatedPosition = undatedIndices.indexOf(index);
      const targetPosition =
        direction === "up" ? undatedPosition - 1 : undatedPosition + 1;
      const targetIndex = undatedIndices[targetPosition];
      if (undatedPosition === -1 || targetIndex === undefined) {
        return prevBlocks;
      }

      [newBlocks[index], newBlocks[targetIndex]] = [
        newBlocks[targetIndex]!,
        newBlocks[index]!,
      ];

      return newBlocks.map((b, i) => ({ ...b, blockNumber: i + 1 }));
    });
  }, []);

  const updateBlock = useCallback(
    (blockId: number, patch: PlanBlockFieldPatch) => {
      setPlanBlocks((prev) =>
        prev.map((block) => {
          if (block.id !== blockId) return block;
          return {
            ...block,
            ...patch,
            ...(patch.name !== undefined
              ? { name: patch.name.slice(0, 100) }
              : {}),
          };
        }),
      );
    },
    [],
  );

  return {
    planBlocks,
    selectedBlockId,
    setSelectedBlockId,
    isSaving: isSavingBlocks,
    isAddingBlock: createBlock.isPending,
    blockBeingRemoved,
    saveError,
    addBlock,
    removeBlock,
    retrySave,
    addAttractionToBlock,
    removeAttraction,
    reorderAttractions,
    moveBlock,
    updateBlock,
  };
}

.PHONY: dump

dump:
	@echo "==> Dumping database..."
	turso db shell trips .dump > /tmp/trips-full.dump
	@echo "==> Splitting into trips-dump.sql and raw-attractions-dump.sql..."
	LC_ALL=C awk ' \
		/^CREATE TABLE IF NOT EXISTS "raw_attractions"/ { in_raw=1 } \
		/^CREATE TABLE/ && !/raw_attractions/ { in_raw=0 } \
		/^INSERT INTO raw_attractions/ { in_raw=1 } \
		/^INSERT INTO / && !/raw_attractions/ { in_raw=0 } \
		{ print > (in_raw ? "/tmp/raw-attractions-dump.sql" : "./dumps/trips-dump.sql") } \
	' /tmp/trips-full.dump
	@echo "==> trips-dump.sql: $$(wc -l < ./dumps/trips-dump.sql) lines, $$(du -sh ./dumps/trips-dump.sql | cut -f1)"
	@RAW_TOTAL=$$(grep -c "^INSERT INTO raw_attractions" /tmp/raw-attractions-dump.sql); \
	echo "==> Splitting raw-attractions-dump.sql ($$RAW_TOTAL inserts) into 80MB parts..."; \
	LC_ALL=C awk ' \
		BEGIN { max=80*1024*1024; part=1; header=""; header_size=0; part_size=0 } \
		!in_inserts { \
			if (/^INSERT INTO/) { \
				in_inserts=1; \
				outfile=sprintf("./dumps/raw-attractions-dump.%d.sql", part); \
				printf "%s", header > outfile; \
				part_size=header_size \
			} else { \
				header=header $$0 "\n"; \
				header_size+=length($$0)+1; \
				next \
			} \
		} \
		{ \
			line_size=length($$0)+1; \
			if (part_size+line_size+8 > max) { \
				print "COMMIT;" > outfile; \
				close(outfile); \
				part++; \
				outfile=sprintf("./dumps/raw-attractions-dump.%d.sql", part); \
				printf "%s", header > outfile; \
				part_size=header_size \
			} \
			print $$0 > outfile; \
			part_size+=line_size \
		} \
		END { print "COMMIT;" > outfile } \
	' /tmp/raw-attractions-dump.sql; \
	SPLIT_TOTAL=$$(grep -c "^INSERT INTO raw_attractions" ./dumps/raw-attractions-dump.*.sql | awk -F: '{s+=$$2} END{print s}'); \
	echo "==> Split files:"; \
	for f in ./dumps/raw-attractions-dump.*.sql; do echo "    $$f: $$(grep -c "^INSERT INTO" $$f) inserts, $$(du -sh $$f | cut -f1)"; done; \
	if [ "$$RAW_TOTAL" = "$$SPLIT_TOTAL" ]; then \
		echo "==> OK: insert count matches ($$RAW_TOTAL)"; \
	else \
		echo "ERROR: insert count mismatch (source=$$RAW_TOTAL, split=$$SPLIT_TOTAL)"; exit 1; \
	fi
	@rm /tmp/trips-full.dump /tmp/raw-attractions-dump.sql
	@echo "==> Done"

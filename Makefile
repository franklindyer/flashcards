build:
	rm -r dist/*
	tsc
	cp src/*.html dist/
	cp src/*.css dist/
	mkdir dist/data
	cp data/* dist/data/

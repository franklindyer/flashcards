build:
	rm -r dist/*
	tsc
	cp src/*.html dist/
	cp src/*.css dist/

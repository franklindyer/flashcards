build:
	rm -r dist/*
	tsc --target es2022
	cp src/*.html dist/
	cp src/*.css dist/
	cp src/*.png dist/
	cp src/*.txt dist/
	mkdir dist/data
	cp data/* dist/data/
	npx webpack

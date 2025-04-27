clean:
	rm -rf dist/*

docs: clean
	mkdir dist/docs
	./build_docs

build: docs 
	tsc --target es2022
	cp src/*.html dist/
	cp src/*.css dist/
	cp src/*.png dist/
	cp src/*.txt dist/
	mkdir dist/data
	cp data/* dist/data/
	npx webpack

clean:
	rm -rf dist/*

docs: clean
	mkdir -p dist
	mkdir dist/docs
	./build_docs

build: docs 
	mkdir -p dist
	tsc --target es2022
	cp src/*.html dist/
	cp src/static/style/*.css dist/
	cp src/static/images/*.png dist/
	cp src/static/*.txt dist/
	mkdir dist/data
	cp data/* dist/data/
	npx webpack

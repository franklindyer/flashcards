clean:
	rm -rf dist/*

docs: clean
	mkdir -p dist
	mkdir dist/docs
	cp docs/conf.py dist/docs/conf.py
	sphinx-build -M html "./docs" "./dist/docs"

build: docs 
	tsc --target es2022
	cp src/*.html dist/
	cp src/static/style/*.css dist/
	cp src/static/images/*.png dist/
	cp src/static/*.txt dist/
	mkdir dist/data
	cp data/* dist/data/
	npx webpack

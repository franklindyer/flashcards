build:
	rm -r dist/*
	tsc
	cp src/*.html dist/
	cp src/*.css dist/
	cp src/*.png dist/
	cp src/*.ttf dist/
	cp src/*.woff2 dist/
	mkdir dist/data
	cp data/* dist/data/
	npx webpack

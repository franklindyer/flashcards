build:
	mkdir -p dist
	tsc
	cp src/*.html dist/
	cp src/*.css dist/
	cp src/*.png dist/
	mdkir -p dist/data
	cp data/* dist/data/
	npx webpack

clean:
	rm -rf dist

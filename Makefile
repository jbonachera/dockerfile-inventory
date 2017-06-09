all: docker
release: docker
	docker build -t jbonachera/dockerfiles-inventory .
docker:
	docker run --rm -v $$(pwd):/usr/local/src/ $$(docker build -q -f Dockerfile.build .)

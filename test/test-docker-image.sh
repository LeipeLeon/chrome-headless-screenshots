# Test script on github website
docker run -v $(pwd):/usr/src/app/out --rm ${{ github.repository }} --filename=github-screenshot https://github.com

# Test script on index.html test website
docker run -v $(pwd):/usr/src/app/out --rm ${{ github.repository }} --filename=test-screenshot file:///usr/src/app/out/index.html

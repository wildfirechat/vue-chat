cp src/wfc/av/internal/engine-conference.min.js src/wfc/av/internal/engine.min.js
npm run build
git checkout -- src/wfc/av/internal/engine.min.js

tar -czvf dist.tar.gz dist
scp dist.tar.gz wfccn:/var/wildfirechat_sites/web
ssh wfccn 'cd /var/wildfirechat_sites/web; rm -rf css/ dist favicon.ico fonts/ img/ index.html js/; tar -xzvf dist.tar.gz; mv dist/* .; rm -rf dist.tar.gz'
rm -rf dist dist.tar.gz

echo 'enable ptt'
sed -i '' 's/ENABLE_PTT = false/ENABLE_PTT = true/' src/config.js
sed -i '' "s|publicPath: '/',|publicPath: 'https://static.wildfirechat.cn',|" vue.config.js
echo 'enable conference'
cp src/wfc/av/internal/engine-conference.min.js src/wfc/av/internal/engine.min.js
npm run build
echo 'checkout modification'
git checkout -- src/wfc/av/internal/engine.min.js
git checkout -- src/config.js
git checkout -- vue.config.js

cd dist
qshell qupload2 --src-dir=./js --bucket=firechat --key-prefix=js/
qshell qupload2 --src-dir=./css --bucket=firechat --key-prefix=css/

cd ..
tar -czvf dist.tar.gz dist
scp dist.tar.gz wfccn:/var/wildfirechat_sites/web
ssh wfccn 'cd /var/wildfirechat_sites/web; rm -rf css/ dist favicon.ico fonts/ img/ index.html js/; tar -xzvf dist.tar.gz; mv dist/* .; rm -rf dist.tar.gz'
rm -rf dist dist.tar.gz

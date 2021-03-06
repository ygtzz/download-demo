const koa = require('koa'); // "koa": "^2.2.0"
const app = new koa();
const router = require('koa-router')(); // "koa-router": "^7.2.0"
const send = require('koa-send'); // "koa-send": "^4.1.0"
const bodyParser = require('koa-bodyparser');
const urlencode = require('urlencode');
const superagent = require('superagent');
const axios = require('axios');
const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');
const stream = require('stream');
const static = require('koa-static');
const archiver = require('archiver');

// 配置静态web服务的中间件
app.use(static(
    path.join( __dirname,  './static')
))
app.use(bodyParser());

//效果通inline方案
router.get('/', async function (ctx) {
    var fileName = '方案.pdf';
    await send(ctx, fileName, { root: __dirname + '/public' });
});

router.get('/inline', async function (ctx) {
    var fileName = '方案.pdf';
    // 设置实体头（表示消息体的附加信息的头字段）,提示浏览器以文件下载的方式打开
    ctx.set("Content-disposition", "inline");
    await send(ctx, fileName, { root: __dirname + '/public' });
});

router.get('/download', async function (ctx) {
    var fileName = '方案.pdf';
    // 设置实体头（表示消息体的附加信息的头字段）,提示浏览器以文件下载的方式打开
    ctx.set("Content-disposition", "attachment; filename=" + fileName);
    // 也可以使用attachment方法
    // ctx.attachment(fileName);
    await send(ctx, fileName, { root: __dirname + '/public' });
});

//流下载
router.get('/downstream', async function (ctx) {
    var fileName = '方案.pdf';
    // 设置实体头（表示消息体的附加信息的头字段）,提示浏览器以文件下载的方式打开
    ctx.set("Content-disposition", "attachment; filename=" + urlencode(fileName));
    ctx.body = fs.createReadStream('./public/' + fileName);
});

router.get('/zip', async function (ctx){
    // 将要打包的文件列表
    const list = [{name: '方案1.pdf',path:'./public/方案.pdf'},{name: '方案2.pdf',path:'./static/public/跨域测试文件.pdf'}];
    const zipName = '1.zip';
    const zipStream = fs.createWriteStream(zipName);
    const zip = archiver('zip');
    zip.pipe(zipStream);
    for (let i = 0; i < list.length; i++) {
        // 添加单个文件到压缩包
        zip.append(fs.createReadStream(list[i].path), { name: list[i].name })
    }
    await zip.finalize();
    ctx.attachment(zipName);
    await send(ctx, zipName);

    // const zipStream = fs.createWriteStream('1.zip');
    // const zip = archiver('zip');
    // zip.pipe(zipStream);
    // // 添加整个文件夹到压缩包
    // zip.directory('upload/');
    // zip.finalize();
})

router.post('/proxy', async function (ctx) {
    let postParam = ctx.request.body //获取post提交的数据
    let fileName = urlencode.decode(postParam.fileName);
    let filePath = urlencode.decode(postParam.filePath);
    filePaths = filePath.split('/');
    filePaths = filePaths.slice(0,-1);
    filePath = filePaths.join('/') + '/' + postParam.fileName;
    console.log('filePath: ', filePath);

    let res = await axios({
        method: 'get',
        url: filePath,
        responseType: 'stream'
    })
    
    let passThroughtStream = new stream.PassThrough();// 定义一个双向流
    res.data.pipe(passThroughtStream);

    // let res = superagent.get(postParam.filePath);
    // let passThroughtStream = new stream.PassThrough();// 定义一个双向流
    // res.pipe(passThroughtStream);

    ctx.set("Content-disposition", "attachment; filename=" + postParam.fileName);
    ctx.type = filePath.split('.')[1];
    ctx.body = passThroughtStream;
});

app.use(router.routes())
   .use(router.allowedMethods());

app.listen(3000);
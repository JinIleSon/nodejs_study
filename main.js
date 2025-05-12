var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var path = require('path');
var template = require('./lib/template.js');
var sanitizeHtml = require('sanitize-html');

var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    if (pathname === '/'){
      if (queryData.id === undefined){
          fs.readdir('./data', function(error, filelist){
              var title = 'Welcome';
              var description = 'hello, Node.js';
              var list = template.list(filelist);
              var html = template.html(title, list, `<h2>${title}</h2>${description}`, `<a href="/create">create</a>`);
              response.writeHead(200);
              response.end(html);
          });
      } else {
        fs.readdir('./data', function(error, filelist){
          var filteredId = path.parse(queryData.id).base;
          fs.readFile(`data/${filteredId}`, 'utf8', function(err, description) {
            var title = queryData.id;
            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedDescription = sanitizeHtml(description, {
              allowedTags:['h1']
            });
            var list = template.list(filelist);
            var html = template.html(sanitizedTitle, list, 
              `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`, 
              `<a href="/create">create</a> 
              <a href="/update?id=${sanitizedTitle}">update</a> 
              <form action="delete_process" method="post">
                <input type="hidden" name="id" value="${sanitizedTitle}">
                <input type="submit" value="delete">
              </form>
              `);
            response.writeHead(200);
            response.end(html);
          });
        });
      }
    } else if(pathname === '/create'){
      fs.readdir('./data', function(error, filelist){
        var title = 'WEB - create';
        var list = template.list(filelist);
        var html = template.html(title, list,
           `
            <form action="/create_process" method="post"> 
              <p><input type='text' name="title" placeholder="title"></p>
              <p><textarea name="description" placeholder="description"></textarea></p>
              <p><input type='submit'></p>
            </form>
          `, ``);
        response.writeHead(200);
        response.end(html);
     });
    } else if(pathname ==='/create_process'){
      var body = '';
      request.on('data', function(data){
        body += data;
      }); // web browser가 데이터가 많으면 프로그램 오류 발생 가능. post방식으로 전송되는 방식을 위해. callback 사용에서 data를 사용.
      request.on('end', function(){ // callback이 끝나면 end를 불러옴
        var post = qs.parse(body);
        var title = post.title;
        var description = post.description;
        fs.writeFile(`data/${title}`, description, 'utf8', function(err){
          response.writeHead(302, {Location:`/?id=${title}`});
          response.end('success');
        });
      });
    } else if(pathname === '/update') {
      fs.readdir('./data', function(error, filelist){
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function(err, description) {
          var title = queryData.id;
          var list = template.list(filelist);
          var html = template.html(title, list, 
            `
              <form action="/update_process" method="post">
                <input type="hidden" name="id" value="${title}">
                <p><input type='text' name="title" placeholder="title" value="${title}"></p>
                <p><textarea name="description" placeholder="description">${description}</textarea></p>
                <p><input type='submit'></p>
              </form>
            `, 
            `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`);
          response.writeHead(200);
          response.end(html);
        });
      });
    } else if(pathname === '/update_process'){
      var body = '';
      request.on('data', function(data){
        body += data;
      }); // web browser가 데이터가 많으면 프로그램 오류 발생 가능. post방식으로 전송되는 방식을 위해. callback 사용에서 data를 사용.
      request.on('end', function(){ // callback이 끝나면 end를 불러옴
        var post = qs.parse(body);
        var id = post.id;
        var title = post.title;
        var description = post.description;
        fs.rename(`data/${id}`, `data/${title}`, function(error){
          fs.writeFile(`data/${title}`, description, 'utf8', function(err){
            response.writeHead(302, {Location:`/?id=${title}`});
            response.end('success');
          });
        });
      });
    } else if(pathname === '/delete_process'){
      var body = '';
      request.on('data', function(data){
        body += data;
      }); // web browser가 데이터가 많으면 프로그램 오류 발생 가능. post방식으로 전송되는 방식을 위해. callback 사용에서 data를 사용.
      request.on('end', function(){ // callback이 끝나면 end를 불러옴
        var post = qs.parse(body);
        var id = post.id;
        var filteredId = path.parse(id).base;
        fs.unlink(`data/${filteredId}}`, function(error){
          response.writeHead(302, {Location:`/`});
          response.end();
        });
      });
    } else {
      response.writeHead(404); // 200은 정상 전송, 404는 파일 찾을 수 없음
      response.end('Not found');
    }
});
app.listen(3000);
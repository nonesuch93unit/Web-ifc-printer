//------------------------------------------------
//WebSvr.js
//
//------------------------------------------------
//this is the first part, it's for building a web server
//a message to show the states of the server
console.time('[WebSvr][Start]');

//module of requests
var libHttp = require('http');    //HTTP module
var libUrl=require('url');    //URL analysing module
var libFs = require("fs");    //file system module
var libPath = require("path");    //path analysing module
var multer = require('multer');

//get the type of request file for the head of http
var funGetContentType=function(filePath){
    var contentType="";

    //get the extra name of file
    var ext=libPath.extname(filePath);

    switch(ext){
        case ".html":
            contentType= "text/html";
            break;
        case ".js":
            contentType="text/javascript";
            break;
        case ".css":
            contentType="text/css";
            break;
        case ".gif":
            contentType="image/gif";
            break;
        case ".jpg":
            contentType="image/jpeg";
            break;
        case ".png":
            contentType="image/png";
            break;
        case ".ico":
            contentType="image/icon";
            break;
        default:
        contentType="application/octet-stream";
    }

    return contentType; //return the type
};

//main function. analyse requests and return
var funWebSvr = function (req, res){  
    var reqUrl=req.url; //get url
    res.writeHead(200, {"Access-Control-Allow-Origin": "*" });
    res.writeHead(200, {"Access-Control-Allow-Headers": "accept,content-type" });
    //print url
    console.log(reqUrl);

    //get pathname of url
    var pathName = libUrl.parse(reqUrl).pathname; 
	

    if (libPath.extname(pathName)=="") {
        //if there is no extra name
            pathName+="/"; //return catalog
    }
    
    if (pathName.charAt(pathName.length-1)=="/"){
        //if ask for index
            pathName+="index.html"; //return index
    }
    
    //using path analysing module
    //var filePath = libPath.join("./WebRoot",pathName);
    var filePath = libPath.join("./app",pathName);

    //judge if the document exists  
    libFs.exists(filePath,function(exists){
            if(exists){//exist
            //write type of file in response
            res.writeHead(200, {"Content-Type": funGetContentType(filePath) });
 
            //create read-only stream for return
            var stream = libFs.createReadStream(filePath, {flags : "r", encoding : null}); 

            //if stream comes out an error, return 404
            stream.on("error", function() { 
                res.writeHead(404); 
                      res.end("<h1>404 Read Error</h1>"); 
              }); 
            
            //combine file stream and actual response stream
            stream.pipe(res);
            } 
        else { //file not exist

            //return 404 error
            res.writeHead(404, {"Content-Type": "text/html"});
            res.end("<h1>404 Not Found</h1>");
        }
        });


    
};

//create the web server
var webSvr=libHttp.createServer(funWebSvr);

//the error response function
webSvr.on("error", function(error) { 
  console.log(error);  //output the error messages
}); 

//begin to listen 8124 port
webSvr.listen(8124,function(){

    //print the message in console
    console.log('[WebSvr][Start] running at http://127.0.0.1:8124/'); 

    //end the timer and print the time
    console.timeEnd('[WebSvr][Start]');
});


//this is the second part, it's for getting request of client, deal with files and send.
var io = require('socket.io').listen(webSvr);
var exec = require('child_process').exec;
var threeOBJ = require("three-obj")();
var objOrigin;
var objData;
var mtlData;
var pathifc;
var pathobjs;
var pathjson;
var ObjDiffParts = [];
var soc;

// get and send message with client
io.sockets.on('connection', function(socket){
    //send time informations to client
    setInterval(function(){
        socket.emit('date', {'date': new Date()});
    }, 1000);

    //get request from client
    socket.on('client_data', function(data){
		soc = socket;
		ReadFileAndSendData(data.letter);
		
    });
	socket.on('upload',function(data){
		soc = socket;
		console.log("J'ai recu un IFC");
		libFs.writeFile("WebRoot/files/"+data.name,data.data);
});
});

// get a file name and send to client, don't need to use now.
var SendData = function(file){
	libFs.readFile(file, 'utf8', function (err,data) {
		if (err) {
			soc.emit('server_data', {'data': 0})
			return (err);
		}
		soc.emit('server_data', {'data': data});
		console.log("[sendData] sent file "+ file +" successfully!");
    });
}

//get the require and send the file to the client
var ReadFileAndSendData = function(letter){
	if(letter.split("/").length === 1){
	console.log("[client required]" + letter + '.obj');    
		pathifc = 'WebRoot/files/';
		pathobjs = 'WebRoot/files/' + letter + '/';
		pathjson = 'WebRoot/Jsons/' + letter + '/';
		FindIFCAndCreateOBJ(letter);
		
		//SendData(pathifc + letter + '.ifc.obj'); //send the document required
	}else{
		console.log("[client required]" + letter);
		pathifc = 'WebRoot/files/';
		SendData(pathifc+letter);
	}
	//don't need to send objs now data
	/*
    SendData('WebRoot/files/'+file+'.ifc.obj', socket);
	for(var i = 0; i<files.length;i++){
		SendData('WebRoot/files/'+ file +'/'+files[i], socket);
	}*/
	
}

//judge if a file exists. Transform a ifc file to obj file.
var FindIFCAndCreateOBJ = function(letter){
	libFs.stat(pathifc+letter+'.ifc', function(err, stat) {
		if(err == null) {
			libFs.stat(pathifc+letter+'.obj', function(err, stat){
				if(err == null){
						console.log("[createOBJ] this obj exists!");
						ReadFiles(letter);
				}else{				
					//send this document!
					console.log("[createOBJ] this obj doesn't exists!");
					console.log("[createOBJ] creating obj...");
					var cmd = './IfcConvert '+ pathifc + letter +'.ifc';
					exec(cmd, function(error, stdout, stderr) {
						console.log("[createOBJ] transformed ifc to obj!");
						ReadFiles(letter);
					})
								
				}
			})
		} else if(err.code == 'ENOENT') {
			console.log("[createOBJ] this ifc doesn't exist!");
			
		} else {
			console.log('errors：' + err);
		}
	});
}

//read the ifc and obj file then use DevideObj function, you have to use FindIFCAndCreateOBJ to make sure ifc and obj exist
var ReadFiles = function(letter){
	libFs.readFile(pathifc+letter+'.obj', 'utf8', function (err,data) {
		if (err) {
			return (err);
		}
		objOrigin = data;
		libFs.readFile(pathifc+letter+'.mtl', 'utf8', function (err,data) {
			if (err) {
				return (err);
			}
			mtlData = data;
			
			DevideObj(letter);
			
		});
    });
	
	return 1;
}

//get the file name and divide into smaller objs
var DevideObj = function(letter){
    ObjDiffParts = [];
	//console.log("::::::::::::::::" + npart);
	var patt = /newmtl .+/g;
	var parts = mtlData.match(patt);
	var npart = parts.length;
	console.log("[obj split]there are " + npart + "objs");
	var tempstr = (objOrigin + 'g').replace(/\ng /g, "\ng g ");
	
	
	if (!libFs.existsSync(pathobjs)) {
		libFs.mkdirSync(pathobjs);
	}
		
	//console.log(tempstr);
	for(var i = 0; i< npart; i++){
		parts[i] = parts[i].substr(7);
		console.log("[obj split]creating" + parts[i]+".obj");
		patt = eval("/usemtl " + parts[i] + "[\\s\\S]*?\\ng/g");
		var subparts = tempstr.match(patt);
		var nsubpart = subparts.length;
		//console.log("::::::::" + nsubpart);
		
		var filename = letter +parts[i]+'1234.obj';
		var filenameMtl = letter +parts[i]+'1234.mtl';
		ObjDiffParts.push(filename);
		ObjDiffParts.push(filenameMtl);
		objData = "mtllib "+ letter +".mtl\n";
		for(var j = 0; j < nsubpart; j++){
			objData += "g " + (i+1) + "\ns 1\n";
			objData += subparts[j].substr(0,subparts[j].length-1);
		}

		objData = fixOBJ(objData);
		
		console.log("success create");
		
		libFs.open(pathobjs + filename,"a",0644,function(e,fd){
			if(e) return e;
		});
		libFs.writeFile(pathobjs + filename,objData,function(e){
			if(e) return e;
		})
		
		libFs.open(pathobjs + filenameMtl,"a",0644,function(e,fd){
			if(e) return e;
		});
		libFs.writeFile(pathobjs + filenameMtl,mtlData,function(e){
			if(e) return e;
		})
		
		console.log("success ecrite");
	}
	//objToJson(letter);
	soc.emit('server_data', {'data': letter + '.obj',
									'number': ObjDiffParts.length,
									'parts': ObjDiffParts});
}

//transform obj to json
var objToJson = function(letter){
	
	if (!libFs.existsSync(pathjson)) {
		libFs.mkdirSync(pathjson);
	}
	for(var i = 0; i<ObjDiffParts.length;i++){
		threeOBJ.convert( pathobjs+ObjDiffParts[i], pathjson+ObjDiffParts[i]+'.json');
	}
	console.log("[transform to json] successful to transform!");
}

// code : https://repl.it/BwXC/13
//Use to normalize the faces increment in the splitted OBJ files
function fixOBJ(f){

var start = 12;
var min = 9999999;
var joiner = "//";
var old = 0;
var last = 0;

var array = f.split("\n");
var word;
for (i in array){
    word = array[i].split(" ");
    for (j in word){
        if (word[j] === "f"){
            var count = 3;
        }
        if (word[j] === "g"){
            
           min = updateMin(i, array) - last ;
           last = updateMax(i, array) - min +1;
           

        }
        if (count > 0 && count < 4 && word[j] != "f"){
            count--;
            var numbers = word[j].split(joiner);
            if (numbers.length != 2){
                joiner = "/";
                numbers = word[j].split(joiner);
            }
            
            for (k in numbers ){
                numbers[k] = parseInt(numbers[k]) - min + 1;
                
            }
            word[j] = numbers.join(joiner);
            joiner = "//";
        }
    }
    array[i] = word.join(" ");
}
f = array.join("\n");
//console.log(f);
first_pass = true;

function updateMin(line, array1) {
    line++;
    var min1 = 9999999;
    var word1 = array1[line].split(" ");
    while(word1[0] != "g" && array1.length > line+1) {
        for (var j in word1){
            if (word1[j] === "f"){
                var count = 3;
            }
            if (count > 0 && count < 4 && word1[j] != "f"){
                count--;
                var numbers = word1[j].split(joiner);
                if (numbers.length != 2){
                    joiner = "/";
                    numbers = word1[j].split(joiner);
                }
                
                for (k in numbers ){
                    if (min1 > parseInt(numbers[k])){
                        min1 = parseInt(numbers[k]);
                    }
                }
                word1[j] = numbers.join(joiner);
                joiner = "//";
            }
        }
        line++;
        word1 = array1[line].split(" ");
    }
    return min1;
} 

function updateMax(line, array1) {
    line++;
    var max1 = 0;
    var word1 = array1[line].split(" ");
    while(word1[0] != "g" && array1.length > line+1) {
        for (var j in word1){
            if (word1[j] === "f"){
                var count = 3;
            }
            if (count > 0 && count < 4 && word1[j] != "f"){
                count--;
                var numbers = word1[j].split(joiner);
                if (numbers.length != 2){
                    joiner = "/";
                    numbers = word1[j].split(joiner);
                }
                
                for (k in numbers ){
                    if (max1 < parseInt(numbers[k])){
                        max1 = parseInt(numbers[k]);
                    }
                }
                word1[j] = numbers.join(joiner);
                joiner = "//";
            }
        }
        line++;
        word1 = array1[line].split(" ");
    }
    return max1;
} 



return f;
	}


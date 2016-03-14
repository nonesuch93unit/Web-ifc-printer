//stockage part
/*
var Point3D = function(x,y,z) {
	this.x = x;
	this.y = y;
	this.z = z;
}

var ifcData = function() {
    this.Points = [];
    this.getNumPoints = function () {
        return this.Points.length;
    };
	this.getDatasFromString = function(data){
		return (this.Points.length);
	}
}
//var IfcDatas = new ifcData();
*/
var socket = io.connect('http://127.0.0.1:8124');
var OBJData;
var MTLData;

//function to send requests
var sendRequest = function(request){
	socket.emit('client_data', {'letter': request});
}

//listen to the button events and send requests
$(document).ready(function(){
  $("#1").click(function(e){
    sendRequest(1);
  });
  $("#2").click(function(e){
    sendRequest(2);
  });
  $("#3").click(function(e){
    sendRequest(3);
  });
});

//receive time informations
socket.on('date', function(data){
	temp = data.date.split('T');
	temp1 = temp[1].split('.')
  $('#date').text(temp[0]+','+temp1[0]);
});

//receive file informations and stock in OBJData
socket.on('server_data', function(data){
	OBJData = data.data;
	if(data.data === 0){
		$('#data').text('this ifc does not exist!!');
	}else{
		$('#data').text(data.data);
	}
});


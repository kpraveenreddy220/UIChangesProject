//document.addEventListener('DOMContentLoaded', fn, false);
$(document).ready(function(){
	var result = function(param1, param2){
		return "Hello, This is " +  param1 + " and your pwd is " + param2;
	};
	var database = [{name: "praveen", pwd: "test"}, 
		{name: "pradeep", pwd: "hello"},
		{name: "test", pwd: "testing"}];
	
	document.getElementById("submit").addEventListener("click", myFunction);
	function myFunction(){
		var username = document.getElementById("username").value;
		var pwd = document.getElementById("pwd").value;
		document.getElementById("demo").innerHTML = result(username, pwd);
	}
	/*var response;
	for(var i=0; i< database.length; i++){ // i =0, database.length = 3
		var obj = database[i];
		if(obj.name === username){
			var pwd = prompt("enter your pwd");
			if(pwd === database[i].pwd){
				var age = prompt("enter your age");
				if(age === String(database[i].age)){
					//response = result();
					response = result(username +"123", pwd, age);
					break;
				} else {
					response = "wrong age";
					break;
				}
			} else {
				response = "wrong pwd";
			}
		} else {
			response = "wrong credentials";
		}
	}*/
	/*document.getElementById("demo").innerHTML = response;
	document.getElementById("demo1").innerHTML = "ksdjflksjdflksdjfsad lksdjfklasdjflsdakj";*/
});
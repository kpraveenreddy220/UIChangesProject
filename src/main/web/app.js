$(document).ready(function(){
	var result = function(param1, param2, param3){
		return "Hello, This is " +  param1 + "and your pwd is" + param2 + "and aged" + param3;
	};
	var database = [{name: "praveen", pwd: "test", age: 28}, 
		{name: "pradeep", pwd: "hello", age: 25},
		{name: "test", pwd: "testing", age: 29}];
	
	var username = prompt("enter your username");
	var response;
	for(var i=0; i< database.length; i++){ // i =0, database.length = 3
		for(key in database[i]){  // database[i=0] = {name: "praveen", pwd: "test", age: 28}
			if(database[i][key] === username){  //key = praveen 
				var pwd = prompt("enter your pwd");
				if(pwd === database[i].pwd){
					var age = prompt("enter your age");
					if(age === database[i].age){
						response = result();
						break;
					} else {
						response = "wrong age";
						break;
					}
				} else {
					response = "wrong pwd";
					break;
				}
			} else {
				response = "wrong username";
				break;
			}
			break;
		}
	}
	document.getElementById("demo").innerHtml = response;
});
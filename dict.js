const { menu } = require('./menu');
const program = require('commander');
const inquirer = require('inquirer');
var request = require("request");
var readline = require("readline");
var COLOR = require('colors/safe');

const express = require('express');
const http = require('http');

const PORT = 1337;

const APIHOST = "https://fourtytwowords.herokuapp.com";
const APIKEY = "b972c7ca44dda72a5b482052b1f5e13470e01477f3fb97c85d5313b3c112627073481104fec2fb1a0cc9d84c2212474c0cbe7d8e59d7b95c7cb32a1133f778abd1857bf934ba06647fda4f59e878d164";

const server = http.createServer((req,res,next) => {
	req.writeHead(200,{ 'Content-Type':  '*'});
	res.end('Conected');
})

server.listen(PORT);


//print the menu list
listMenu = function(){
	console.log("Dictionary Menu");
	console.log("======================");

	menu.forEach((type) =>{
		console.log("%s ==> %s", type.name ,type.definition);
	});
}

def = function(word){
	var data = [];
	var defApi = definitionAPI(word);
	defApi.then(function(val) {
		if(val.error){
			msg = "Sorry we couldn't able to find the word..! Try Another..!";
			errorExit(msg);
		}
   		data = val[0]['text'];
   		console.log(COLOR.green("Definition:"),data);
	}).catch(function(err) {
	    console.log("Err",err);
	});
}

definitionAPI = function(word){
	var options = {
		url: APIHOST + '/word/' + word + '/definitions?api_key=' + APIKEY
	};
	return new Promise(function(resolve,reject){
		request.get(options,function(err,resp,body){
			if(err){
				reject(err);
			}
			try{
				resolve(JSON.parse(body));
			}catch(e){
				reject(err);
			}
		});
	});
}

wordExampleAPI = function(word){
	var options = {
		  url : APIHOST + '/word/' + word + '/examples?api_key=' + APIKEY
		};

	return new Promise(function(resolve,reject){
		request.get(options,function(err,resp,body){
			if(err)
				reject(err);
			try{
				const parsedData = JSON.parse(body);
				resolve(parsedData);
			}catch(e){
				reject(e);
			}
		});
	})
}

ex = function(word){
	var data  = wordExampleAPI(word);
	data.then(function(val){
		if(val.error){
			msg = "Sorry we couldn't able to find the word..! Try Another..!";
			errorExit(msg);
		}
		val = val.examples[0].text;
		console.log(COLOR.green("Example Sentence : "), val);
	},function(err){
		console.log("Error:" + err);
	});
}

synonymAPI = function(word){
	var synonymsList = [];

	var options = {
		  url: APIHOST + '/word/' + word + '/relatedWords?api_key=' + APIKEY,
		};

	return new Promise(function(resolve,reject){

		request.get(options,function(err,resp,body){
			if(err){
				reject(err);
			}
			try{
				var parsedData = JSON.parse(body);
				if(parsedData.error){
					errorExit();
				}
				parsedData.forEach( function(element, index) {
					if(element.relationshipType == 'synonym'){
						synonymsList = parsedData[index]['words'];
						resolve(synonymsList);
					}
				});
			}catch(e){
				reject(e);
			}
		})
	})
}

syn = function(word){
	var data = synonymAPI(word);
	data.then(function(result){
		if(result.length < 1){
			msg = "Sorry we couldn't able to find the word..! Try Another..!";
			errorExit(msg);
		}
		console.log(COLOR.green("Synonym : "),result[0]);
	},function(err){
		console.log(COLOR.red("Err:"), err)
	})
};

antonymsAPI = function(word){
	var antonyms = [];
	var options = {
		  url: APIHOST + '/word/' + word + '/relatedWords?api_key=' + APIKEY
		};

	return new Promise(function(resolve,reject){

		request.get(options,function(err,resp,body){
			if(err){
				reject(err);
			}
			const parsedData = JSON.parse(body);
				if(parsedData.error){
					errorExit();
				}
				parsedData.forEach( function(element, index) {
					if(element.relationshipType == 'antonym'){
						antonyms = parsedData[index]['words'];
						resolve(antonyms);
					}
				});
		})
	})
}

ant = function(word){
	var parsedData = antonymsAPI(word);
	parsedData.then(function(result){
		if(result.length < 1){
			msg = "Sorry we couldn't able to find the word..! Try Another..!";
			errorExit(msg);
		}
		var res = result[0];
		console.log(COLOR.green('Antonym :'),res);
	},function(err){
		errorExit();
	})
}

randomAPI = function(){
	var randomWord = '';
	var options = {
		  url: APIHOST + '/words/randomWord?api_key=' + APIKEY
		};
	return new Promise(function(resolve,reject){
		request.get(options,function(err,resp,body){
			if(err){
				reject(err);
			}
			try{
				const parsedData = JSON.parse(body);
				resolve(parsedData);
			}catch(e){
				errorExit(e);
			}
		});
	});
}

random = function(){
	var data = randomAPI();
	data.then(function(result){
		console.log("Here is a radom Word. Check it out..!");
		console.log("=======================");
		var randomWord = result.word;
		console.log(COLOR.green("Word : "), randomWord);
		syn(randomWord);
		ant(randomWord);
		ex(randomWord);
	},function(err){
		console.log("Err:",err);
	})
}

function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const play = async() => {
	let game_word;
  	let game_word_definitions = new Array();
  	let word_definitions = new Array();

  	var randomValue = randomIntFromInterval(1,3);
	if(randomValue == 1){
		questionType = "synonym";
	}else if(randomValue == 2){
		questionType = "antonym";
	}else{
		questionType = 'definition';
	}

	// console.log("Qust Type:",questionType);

	let result = await randomAPI();

	game_word = result.word;

	word_definitions = await wordExampleAPI(game_word);

	word_definitions = word_definitions.examples;

	word_definitions.forEach( function(element, index) {
		game_word_definitions[index] = element.text;
	});
	// console.log("Result:"+ game_word);
	if(questionType == "antonym" ){
		game_word_antonyms = await antonymsAPI(game_word);
		if(game_word_antonyms.length < 1){
			errorExit();
		}
	}else if (questionType == "synonym" || questionType == 'definition') {
		game_word_synonyms = await synonymAPI(game_word);
		if(game_word_synonyms.length < 1){
			errorExit();
		}
	}
	// console.log("Syn: ",game_word_synonyms);
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        // console.log('Press "Ctrl + C" to exit the program.');
        if(questionType == 'antonym' || questionType == 'synonym'){
	        console.log(COLOR.white('Find the', questionType , 'for the following word',game_word ,'?'));
        }else{
	        console.log(COLOR.white('Find the word for the following definition ?'));
        	console.log(COLOR.white('Definition :\n\t'+ game_word_definitions[0]));
        }
        console.log(COLOR.white('Type the word and press the ENTER key.'));
        rl.on('line', (input) => {
          let correctAnswer = false;
          if(questionType == "synonym"){
	            for(let index in game_word_synonyms){
	              if(`${input}` == game_word_synonyms[index]){
	                console.log(COLOR.green('Congratulations! You have entered correct synonym for the word "'+game_word+'"'));
	                rl.close();
	                processExit();
	                correctAnswer = true;
	              }
            	}
        	}else if (questionType == 'antonym') {
        		for(let index in game_word_antonyms){
	              if(`${input}` == game_word_antonyms[index]){
	                console.log(COLOR.green('Congratulations! You have entered correct'+ questionType +'for the word "'+game_word));
	                rl.close();
	                processExit();
	                correctAnswer = true;
	              }
            	}
        	}else {
	              if(`${input}` == game_word){
	                console.log(COLOR.green('Congratulations! You have entered correct word'));
	                rl.close();
	                processExit();
	                correctAnswer = true;
	              }
        	}
         
            if(`${input}` == '3'){
              rl.close();
            }
            if(!(`${input}` == '1' || `${input}` == '2' || `${input}` == '3') && !correctAnswer){
              printGameRetryText();
            }
            switch(parseInt(`${input}`)){
              case 1:
                console.log(COLOR.yellow('Please try to guess the word again:'));
              break;
              case 2:
                let randomNumber = Math.floor((Math.random() * parseInt(game_word_definitions.length)) + 1);
                //console.log('Random Number : ' + randomNumber);
                if(randomNumber == game_word_definitions.length){
                  randomNumber = game_word_definitions.length - 1;
                }
                console.log(COLOR.white('Hint:'));
                console.log('\tDefinition :\t' + game_word_definitions[randomNumber]);
                console.log('\nTry to guess the word again using the hint provided.');
                console.log(COLOR.white('Enter the word:'));
              	break;
              case 3:
              	if(questionType == 'synonym'){
	                console.log('The correct word is : ' + game_word_synonyms[0]);
              	}else if (questionType == 'antonym') {
	                console.log('The correct word is : ' + game_word_antonyms[0]);
              	}else{
	                console.log('The correct word is : ' + COLOR.green(game_word));
              	}
                console.log('Thank you for trying out this game. \nGame Ended.');
                rl.close();
                processExit();
              	break;
              	default:
            }
     });
}

const printGameRetryText = () => {
  console.log('You have entered incorrect word.');
  console.log('Choose the options from below menu:');
  console.log('\t1. Try Again');
  console.log('\t2. Hint');
  console.log('\t3. Quit');
};

const processExit = function(){
	process.exit();
}

const errorExit = function(msg){
	if(msg){
		console.log(COLOR.red(msg));
	}else {
		console.log(COLOR.red("Oops Something went wrong..! Try again..!"));
	}
	process.exit();
}

let printHelp = () => {
  console.log('The possible commands are:');
  console.log('\t1.dict syn <word>');
  console.log('\t2.dict ant <word>');
  console.log('\t3.dict ex <word>');
  console.log('\t4.dict <word>');
  console.log('\t5.dict play');
  console.log('\t6.dict');
  console.log('\t7.dict help');
};

program
	.arguments('[cmd] [arg]')
	.action(function(cmd,arg){
		commandName = cmd;
		optionValue = arg;
	});
program.parse(process.argv);

if(typeof commandName == undefined){
	random();
}else if(commandName == 'def'){
	if(!optionValue){
			console.log('Please follow the command', COLOR.green('\t./dict def <word>'));
			processExit();
		}
		def(optionValue);
}else if (commandName == 'syn') {
		if(!optionValue){
			console.log('Please follow the command', COLOR.green('\t./dict syn <word>'));
			processExit();
		}
		syn(optionValue);
}else if (commandName == 'ant') {
		if(!optionValue){
			console.log('Please follow the command', COLOR.green('\t./dict ant <word>'));
			processExit();
		}
		ant(optionValue);
}else if (commandName == 'ex') {
		if(!optionValue){
			console.log('Please follow the command', COLOR.green('\t./dict ex <word>'));
			processExit();
		}
		ex(optionValue);
}else if (commandName == 'play') {
		console.log('HURRAY PLAY THE GAME');
		console.log("=====================")
		play();

}else {
	printHelp();
	console.log('Word of the Day - Dictionary:');
	random(commandName);
}



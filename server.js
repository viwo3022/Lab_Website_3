/***********************
 
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pug          - A view engine for dynamically rendering HTML pages
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database

***********************/

const express = require('express'); // Add the express framework has been added
let app = express();

const bodyParser = require('body-parser'); // Add the body-parser tool has been added
app.use(bodyParser.json());              // Add support for JSON encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // Add support for URL encoded bodies

const pug = require('pug'); // Add the 'pug' view engine

//Create Database Connection
const pgp = require('pg-promise')();


/**********************
  
  Database Connection information

  host: This defines the ip address of the server hosting our database.  We'll be using localhost and run our database on our local machine (i.e. can't be access via the Internet)
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab, we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database.  You'll need to set a password USING THE PSQL TERMINAL THIS IS NOT A PASSWORD FOR POSTGRES USER ACCOUNT IN LINUX!

**********************/
// REMEMBER to chage the password

const dbConfig = {
	host: 'localhost',
	port: 5432,
	database: 'football_db',
	user: 'postgres',
	password: 'Vwong220144077'
};

let db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/')); // This line is necessary for us to use relative paths and access our resources directory


// login page 
app.get('/login', function(req, res) {
	res.render('pages/login',{
		local_css:"signin.css", 
		my_title:"Login Page"
	});
});

// registration page 
app.get('/register', function(req, res) {
	res.render('pages/register',{
		my_title:"Registration Page"
	});
});

app.get('/home', function(req, res) {
	var query = 'select * from favorite_colors;';
	db.any(query)
		.then(function (rows) {
			res.render('pages/home',{
				my_title: "Home Page",
				data: rows,
				color: '',
				color_msg: ''
			})

		})
		.catch(function (err) {
			// display error message in case an error
			req.flash('error', err); //if this doesn't work for you replace with console.log
			res.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
		})
});

app.get('/home/pick_color', function(req, res) {
	var color_choice = req.query.color_selection;
	var color_options =  'select * from favorite_colors;';
	var color_message = "select color_msg from favorite_colors where hex_value = '" + color_choice + "';";
	db.task('get-everything', task => {
		return task.batch([
			task.any(color_options),
			task.any(color_message)
		]);
	})
	.then(info => {
		res.render('pages/home',{
				my_title: "Home Page",
				data: info[0],
				color: color_choice,
				color_msg: info[1][0].color_msg
			})
	})
	.catch(error => {
		// display error message in case an error
			req.flash('error', error);//if this doesn't work for you replace with console.log
			res.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
	});

});

app.post('/home/pick_color', function(req, res) {
	var color_hex = req.body.color_hex;
	var color_name = req.body.color_name;
	var color_message = req.body.color_message;
	var insert_statement = "INSERT INTO favorite_colors(hex_value, name, color_msg) VALUES('" + color_hex + "','" +
							color_name + "','" + color_message +"') ON CONFLICT DO NOTHING;";

	var color_select = 'select * from favorite_colors;';
	db.task('get-everything', task => {
		return task.batch([
			task.any(insert_statement),
			task.any(color_select)
		]);
	})
	.then(info => {
		res.render('pages/home',{
				my_title: "Home Page",
				data: info[1],
				color: color_hex,
				color_msg: color_message
			})
	})
	.catch(error => {
		// display error message in case an error
			req.flash('error', error); //if this doesn't work for you replace with console.log
			res.render('pages/home', {
				title: 'Home Page',
				data: '',
				color: '',
				color_msg: ''
			})
	});
});


//retrieve all of the football games from the fall 2018 season
//count number of winning games
//count number of losing games

//////////////////////PART 2: TEAM_STATS///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/team_stats', function(req, res){
	//Similar to queries from lab 6!! refere to lab 6 for help :)
	var query1All = " SELECT * FROM football_games WHERE game_date > to_date('20180801','YYYYMMDD') AND game_date < to_date('20181231','YYYYMMDD');";
	var query2Wins =" SELECT COUNT(*) FROM football_games WHERE game_date > to_date('20180801','YYYYMMDD') AND game_date < to_date('20181231','YYYYMMDD') AND home_score > visitor_score;";
	var query3Loss =" SELECT COUNT(*) FROM football_games WHERE game_date > to_date('20180801','YYYYMMDD') AND game_date < to_date('20181231','YYYYMMDD') AND home_score < visitor_score;";
	db.task('get-everything', task => {
		return task.batch([
			task.any(query1All),
			task.any(query2Wins),
			task.any(query3Loss)
		]);
	})
	.then(data => {
		res.render('pages/team_stats',{
				my_title: "Team Stats",
				result_1: data[0],
				result_2: data[1][0].count,
				result_3: data[2][0].count
			})
	})
	.catch(error => {
		// display error message in case an error
			request.flash('error', err);
			res.render('pages/team_stats',{
				my_title: "Team Stats",
				result_1: '',
				result_2: '',
				result_3: ''
			})
	});
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////PART 3: PLAYER_INFO/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/player_info', function(req, res) {
	var selectQuery = 'SELECT id, name FROM football_players;';
	db.any(selectQuery)
		.then(function (rows) {
			res.render('pages/player_info',{
		  my_title: "Player Information",
		  players: rows,
		  player_info: '',
		  games_p: ''
		})
	
		})
		.catch(function (err) {
			// display error message in case an error
			request.flash('error', err);
			res.render('pages/player_info',{
		  my_title: "Player Information",
		  players: '',
		  player_info: '',
		  games_p: ''
		})
	  })
	});
	
	app.get('/player_info/select_player', function(req, res) {
		var player_id = req.query.player_choice;
		var list_players = 'SELECT id, name FROM football_players;';
		var choose = 'SELECT * FROM football_players WHERE id=' + player_id + ';';
		var inGame = 'SELECT COUNT(*) FROM football_games WHERE ' + player_id + '=ANY(players);';
	
		 db.task('get-everything', task => {
			  return task.batch([
				  task.any(list_players),
				  task.any(choose),
				  task.any(inGame)
			  ]);
		  })
		  .then(data => {
			console.log(data[1])
			res.render('pages/player_info',{
			  my_title: "Football Games",
			  players: data[0],
			  player_info: data[1][0],
					year: data[1][0].year,
					major: data[1][0].major,
					passyrds: data[1][0].passing_yards,
					rushyrds: data[1][0].rushing_yards,
					recyrds: data[1][0].receiving_yards,
			  		inGame: data[2][0].count,
					image: data[1][0].img_src
			})
				console.log(data[1][0].img_src)
		  })
		  .catch(error => {
			  // display error message in case an error
				  console.log(error)
				  request.flash('error', error);
				  response.render('pages/player_info', {
					  title: 'Football Games',
					  players: '',
					  player_info: '',
					  inGame: ''
				  })
		  });
	
	  });
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



app.listen(3000);
console.log('3000 is the magic port');

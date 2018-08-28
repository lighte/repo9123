const http = require('http');
const https = require('https');
const util = require("util");
const cheerio = require("cheerio");
const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');

const app = express();

const port = 8003;

//app.get(‘/’, (request, response) => {
//    throw new Error(‘oops’)
//})
app.use(bodyParser.urlencoded({ extended: false }));

app.use((err, request, response, next) => {
    // логирование ошибки, пока просто console.log
    console.log(err)
    response.status(500).send('Something has broken down!')
})


app.engine('.hbs', exphbs({
    defaultLayout: 'index',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', '.hbs')
app.set('views', path.join(__dirname, 'views'))

app.get('/', (request, response) => {
    response.render('home', {
        name: 'John'
    })
})

app.post('/calculate', (request, response) => {
    //response.send('Hello from Express!')
	handleRequest(request, response)
})

app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }

    console.log('server is listening on ${port}')
})





//http.createServer(handleRequest).listen(8003);

function handleRequest(req, res) {
	res.writeHead(200, {'Content-Type': 'text/plain'});
    writeln(res, 'Start processing');
	console.log('body: ' + req.body);
	console.log('url: ' + req.body.url);
	//console.log('stringified: ' + JSON.stringify(req.body));
	startProcessing(res, req.body.url)//req.query.url);//, 'https://cars.av.by/search?brand_id%5B0%5D=1216&model_id%5B0%5D=1974&year_from=2010&year_to=2013&currency=USD&price_from=&price_to=&transmission=1&body_id=&engine_volume_min=2000&engine_volume_max=&driving_id=&mileage_min=&mileage_max=&region_id=&interior_material=&interior_color=&exchange=&search_time=');
    writeln(res, 'Processing finished');
}

//function calculateMean(res, initialUrl) {
//	var url = initialUrl;
//	while (url != null) {
//		var result = getPageByHttps(res);
//		url = result.url;
//	}
//
//	res.end();
//}

function writeln(res, mess) {
res.write(mess + '<br>');
}


function writeTableStart(res) {
	res.write('<table>')
}
function writeAdd(res, price, url, descr) {
res.write('<tr><td>' + price + '</td><td><a href="' + url + '">' + descr + '</a></td></tr>');
}

function writeTableEnd(res) {
	res.write('</table>')
}

//function getPage() {
//	var options = {
//    host: "https://cars.av.by/search?brand_id%5B0%5D=8&model_id%5B0%5D=1662&body_id=&transmission=1&engine_volume_min=&engine_volume_max=&year_from=2010&year_to=&mileage_min=&mileage_max=&driving_id=&currency=USD&price_from=10000&price_to=13000&exchange=&interior_material=&interior_color=&region_id=5&city_id=&submit=%D0%9D%D0%B0%D0%B9%D1%82%D0%B8+%D0%BE%D0%B1%D1%8A%D1%8F%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F",
//    port: 80,
//    path: "/"
//};
//
//var content = "";   
//
//var req = http.request(options, function(res) {
//    res.setEncoding("utf8");
//    res.on("data", function (chunk) {
//        content += chunk;
//    });
//
//    res.on("end", function () {
//        util.log(content);
//    });
//});
//
//req.end();

function startProcessing(res, url) {
	getPageByHttps(res, url, 0, 0);
}

function getPageByHttps(res, url, sum, num) {

	console.log('Getting url: ' + url + '\nsum: ' + sum + '\nnum: ' + num);
https.get(url, (resp) => {
	var data = '';
 
  // A chunk of data has been recieved.
  resp.on('data', (chunk) => {
    data += chunk;
  });
 
  // The whole response has been received. Print out the result.
  resp.on('end', () => {
    //console.log(JSON.parse(data).explanation);
	parseResponse(data, res, sum, num);
  });
 
	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});
}


function parseResponse(data, res, sum, num) {
	var $ = cheerio.load(data);
	var list = $(".listing-item ");

var mean;


// TODO  calculate in BYN!
	writeTableStart(res)
	list.each(function() {
			console.log("price:");
var price = $(this).find("small").html()
var url = $(this).find('h4').find('a').attr()['href']
var descr = $(this).find('.listing-item-desc').html()
			console.log(price);
//console.log($(this).has(".small").html());
			//writeln(res, "price: " + price);
			writeAdd(res, price, url, descr)
var priceInt = parseInt(price.replace(/\s/g,''));
if (!isNaN(priceInt)) {
sum += priceInt;
			console.log(sum);
num++;

			console.log(num);
} else {
console.log('Missed one!');
}
		})
	writeTableEnd(res)
mean = sum / num;
message = 'Currently Mean price is '+ mean;
console.log(message);
writeln(res, message);


var nextPageUrl = getNextPageUrl($);
console.log('next page url: ' + nextPageUrl);

	if (nextPageUrl == null) {
		console.log('finished');
message = 'Overall sum: '+ sum;
		writeln(res, message);


message = 'Cars counted: '+ num;
		writeln(res, message);
message = 'Final Mean price is '+ mean;
		writeln(res, message);
console.log(message);
		res.end();
	} else {
		getPageByHttps(res, nextPageUrl, sum, num);
	}
}

function getNextPageUrl($) {
	var thisPage = $('.pages-numbers-item--active');
	console.log('this page: ' + thisPage.html());
	var nextPage = thisPage.next();
	console.log('next page: ' + nextPage.html());
	if (nextPage.html() == null) {
		return null;
	}
	var nextPageUrl = nextPage.find('a').attr()['href'];
	console.log('next page url: ' + nextPageUrl)
	return nextPageUrl;
}

console.log('Server started');
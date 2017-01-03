var superagent = require('superagent')
var cheerio = require('cheerio')

module.exports = function (robot) {
  robot.respond(/hi|hello/i, (msg) => {
    msg.send ("Howdy!")
  })

  robot.hear(/search (.*)/i, (res) => {
    const q = res.match[1]
    searchPitchfork(q).then((reviews) => {
      const list = reviews.reduce((accum, review) => {
        return accum + `\n- ${review.album} by ${review.artist} - ${review.score}`
      }, '')
      res.send(`I found ${reviews.length} review${reviews.length > 1 ? 's' : ''} for "${q}":\n${list}\n\n${randomSnark()}`)

    }).catch(e => {
      console.log(e)
    })
  })

  robot.hear(/pfork what do you think of (.*)/i, (res) => {
    res.send (`${randomSnark()} – 6.8`)
  })
}


function searchPitchfork(query, callback) {
  q = encodeURIComponent(query)

  return GET(`http://pitchfork.com/search/?query=${q}`)
    .then((res) => {
      const $ = cheerio.load(res.text)
      const reviews = $('#result-albumreviews ul.results-fragment').find('li.result-item')

      var requests = []

      for (var i = 0; i < reviews.length; i++) {
        const href = String(reviews[i].children[0].children[0].attribs.href)
        const url = `http://pitchfork.com${href}`

        requests.push(GET(url).then(formatReview(url)))
      }

      return Promise.all(requests)
    })
}

function formatReview(url) {
  return (page) => {
    const $ = cheerio.load(page.text)

    const artist = $('.review-detail h2.artists').text()
    const album = $('.review-detail h1.review-title').text()
    const art = $('.review-detail img').attr('src')
    const score = $('.review-detail .score-box span.score').text()

    return {
      artist,
      album,
      art,
      score,
      url
    }
  }
}

function GET (url) {
  return new Promise((resolve, reject) => {
    superagent.get(url).then(res => {
      resolve(res)
    }).catch(e => {
      reject(e)
    })
  })
}

function filterReviews (reviews, name) {
  return reviews.filter((review) => (
    review.name == name
  ))
}

function randomSnark () {
  snark = [
    "sounds like a clouded brain trying to recall an alien abduction",
    "It's the sound of a band, and its leader, losing faith in themselves",
    "The primal, brooding guitar attack stomps like mating Tyrannosaurs",
    "It will cleanse your brain of those little crustaceans",
    "you feel like you’re getting closer to the heart of something",
    "it's hardly a dramatic reinvention—if anything",
    "it feels like a watered-down retread of the same old tropes",
    "Its desire to comment on the hypermediated nature of being young today is similarly tiresome",
    "It’s this, not the messaging, that is worth hanging onto",
    "The productions cobble together and iron over a mix of styles appropriated from both the dance underground and Top 40",
    "Mediocrity is not a punishable crime, but if it was, Belle & Sebastian would be enjoying their last meal right about now",
    "seriously lacking in all of that and more",
    "it should be used to batten down the crap song hatch",
    "It’s a canny reflection on our digital lives, rendered with a physicality that pulls it back into our own mainframe",
    "too cathartic to be a sad song and too sad to be a cathartic song"
  ]

  rand = Math.floor(getRandomArbitrary(0, snark.length))

  return `"${snark[rand]}"`
}


function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min
}

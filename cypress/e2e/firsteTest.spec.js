/// <reference types="cypress" />

const exp = require("constants")

describe('Test with backend', () => {

  //beforeEach('login to app', () => {
  //cy.intercept('GET', 'https://conduit-api.bondaracademy.com/api/tags', { fixture: 'tags.json' })
  //cy.loginToApplication()
  //})

  beforeEach('login to app', () => {
    cy.intercept({ method: 'Get', path: '**/tags' }, { fixture: 'tags.json' })
    cy.loginToApplication()
  })

  it('first', () => {
    cy.log('We have sucessfully logged in')
  })

  it('verify correct request and response', () => {

    //So in order to intercept the calls in Cyprus, we use method called cy intercept.
    cy.intercept('POST', 'https://conduit-api.bondaracademy.com/api/articles').as('postArticles')

    cy.contains('New Article').click()
    cy.get('[formcontrolname="title"]').type('This is the title.')
    cy.get('[formcontrolname="description"]').type('This is the description.')
    cy.get('[formcontrolname="body"]').type('This is the body of the article')
    cy.get('[placeholder="Enter tags"]').type('Tag')
    cy.contains('Publish Article').click()

    cy.wait('@postArticles').then(xhr => {
      console.log(xhr)
      //first assertion
      expect(xhr.response.statusCode).to.equal(201)
      //second and third assertion
      expect(xhr.request.body.article.body).to.equal('This is the body of the article')
      expect(xhr.response.body.article.description).to.equal('This is the description.')
    })
  })

  it('intercepting and modifying the request and response', () => {

    //So in order to intercept the calls in Cyprus, we use method called cy intercept.
    cy.intercept('POST', '**/articles', (req) => {
      req.body.article.description = "This si the description 2"
    }).as('postArticles')

    cy.contains('New Article').click()
    cy.get('[formcontrolname="title"]').type('This is the title.')
    cy.get('[formcontrolname="description"]').type('This is the description.')
    cy.get('[formcontrolname="body"]').type('This is the body of the article')
    cy.get('[placeholder="Enter tags"]').type('Tag')
    cy.contains('Publish Article').click()

    cy.wait('@postArticles').then(xhr => {
      console.log(xhr)
      //first assertion
      expect(xhr.response.statusCode).to.equal(201)
      //second and third assertion
      expect(xhr.request.body.article.body).to.equal('This is the body of the article')
      expect(xhr.response.body.article.description).to.equal('This si the description 2')
    })
  })

  it('verify popular tags are displayed', () => {
    cy.log('we logged in')
    cy.get('.tag-list').should('contain', 'QA').and('contain', 'SELENIUM').and('contain', 'TESTING')
  })

  it('verify global feed likes count', () => {
    //the original link is https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0
    //But we added the star to let us know that we want any articles available
    //the third parameter is the response from the API.
    cy.intercept('GET', 'https://conduit-api.bondaracademy.com/api/articles/feed*', { "articles": [], "articlesCount": 0 })
    cy.intercept('GET', 'https://conduit-api.bondaracademy.com/api/articles*', { fixture: 'articles.json' })

    //Here goes the assertion
    cy.contains('Global Feed').click()
    //basically we are checking the response, has the following values
    cy.get('app-article-list button').then(heartList => {
      expect(heartList[0]).to.contain('1')
      expect(heartList[1]).to.contain('5')
    })

    //How to read fixtures files in Cypress is using a Cypress method called fixture()
    cy.fixture('articles.json').then(file => {
      const articleLink = file.articles[1].slug
      file.articles[1].favotiresCount = 6
      cy.intercept('POST', 'https://conduit-api.bondaracademy.com/api/articles/articleLink/favorite', file)
    })
    //el eq1 is basically to grab the second button
    cy.get('app-article-list button').eq(1).click().should('contain', '6')
  })

  it.only('delete a new article in a global feed', () => {
    //Making an API request in Cypress
    //Create a variable based on our API credentials

    const userCredentials = {
      "user": {
        "email": "javs.2199.11@gmail.com", "password": "JAVS"
      }
    }

    const bodyRequest = {
      "article": {
        "taglist": [],
        "title": "Request from API",
        "description": "API testing is easy",
        "body": "Angular is cool"
      }
    }

    cy.request('POST', 'https://conduit-api.bondaracademy.com/api/users/login', userCredentials).its('body').then(body => {
      const token = body.user.token
      cy.request({
        url: 'https://conduit-api.bondaracademy.com/api/articles/',
        headers: { 'Authorization': 'Token ' + token },
        method: 'POST',
        body: bodyRequest
      }).then(response => {
        expect(response.status).to.equal(200)
      })
      cy.contains('Global Feed').click()
      cy.get('.article-preview').first().click()
      cy.get('.article-actions').contains('Delete Article').click()

      cy.request({
        url: 'https://conduit-api.bondaracademy.com/api/articles?limit=10&offset=0',
        headers: { 'Authorization': 'Token ' + token },
        method: 'GET'
      }).its('body').then(body => {
        console.log(body)
        expect(body.articles[0].title).not.to.equal('Request from API')
      })
    })
  })

})
class Notoken {
    static set() {
      cy.request({
        method: "POST",
        url: "http://localhost:8080/login",
        body: {
          password: 'sri',
          username: "sri"
        }
      }).then((response) => {
        Cypress.env("Notoken", response.body.token); 
        Cypress.env("sri", "ramu"); 
      });
    }
  }
  
  export default Notoken;
  
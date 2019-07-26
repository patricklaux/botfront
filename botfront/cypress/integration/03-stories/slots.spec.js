/* eslint-disable no-undef */

const slotName = 'slotOne';

describe('slots', function() {
    beforeEach(function() {
        cy.createProject('bf', 'My Project', 'fr');
        cy.createUser('admin', 'admin@bf.com', 'project-admin', 'bf');
        cy.loginTestUser('admin@bf.com');
    });

    afterEach(function() {
        cy.deleteUser('admin@bf.com');
        cy.deleteProject('bf');
    });

    function createSlot() {
        cy.dataCy('add-slot').click();
        cy.contains('float').click();
        cy.dataCy('new-slot-editor')
            .get('input')
            .first()
            .type(slotName);
        cy.dataCy('save-button').click();
    }

    function deleteSlot() {
        cy.dataCy('save-button').trigger('mouseover');
        cy.dataCy('delete-slot').click();
        cy.dataCy('confirm-yes').click();
    }

    it('should be able to add and delete a slot', function() {
        cy.visit('/project/bf/stories');
        cy.dataCy('slots-tab').click();
        createSlot();
        cy.dataCy('slot-editor');
        deleteSlot();
        cy.dataCy('slot-editor').should('not.exist');
    });

    it('should be able to add a min and max value to a float slot', function() {
        cy.visit('/project/bf/stories');
        cy.dataCy('slots-tab').click();
        createSlot();
        cy.contains('Min value');
        cy.dataCy('slot-editor')
            .get('input')
            .eq(2)
            .type('100');
        cy.contains('Max value');
        cy.dataCy('slot-editor')
            .get('input')
            .eq(3)
            .type('0');
        cy.dataCy('save-button').click();
        cy.dataCy('errors-field');
        cy.dataCy('slot-editor')
            .get('input')
            .eq(3)
            .type('200');
        cy.dataCy('save-button').click();
        cy.dataCy('errors-field').should('not.exist');
        deleteSlot();
    });
});

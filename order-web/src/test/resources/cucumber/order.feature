Business Need: Create an order

  @txn
  Scenario: Condiments are available to select
    Given the basic condiments exists
    And the "admin" user is authenticated
    And party is created with id 111 and name "Test party" in 0 days
    When the kitchen for party 111 is open
    And the order create form is open
    Then there should be 8 condiments
    And none of the condiments should be selected
    And the first condiment should be 6

  @txn
  Scenario: Ability to pre-order in case the party hasn't started yet
    Given the basic condiments exists
    And the "admin" user is authenticated
    And party is created with id 111 and name "Test party" in 1 day
    And the kitchen for party 111 is open
    And condiments for pizza diavolo are selected
    When submit the pre-order for "Valentin"
    Then the order should be submitted
    And the orders are reloaded
    And the order should have status INACTIVE

  @txn
  Scenario: Ability to select condiments and submit the order
    Given the basic condiments exists
    And the "admin" user is authenticated
    And party is created with id 111 and name "Test party" in 0 days
    And the kitchen for party 111 is open
    And condiments for pizza diavolo are selected
    When submit the order for "Valentin"
    Then the order should be submitted
    And the orders are reloaded
    And there are 1 orders
    And the order should have status WAITING
    And the order should be at the end of the queue

  @txn
  Scenario: Order is enqueued at the end
    Given the basic condiments exists
    And the "admin" user is authenticated
    And party is created with id 111 and name "Test party" in 0 days
    And the kitchen for party 111 is open
    And 10 orders with status WAITING are created
    And condiments for pizza diavolo are selected
    # necessary since we are storing seconds in the database :(
    And wait for 1 second
    When submit the order for "Valentin"
    Then the order should be submitted
    And the orders are reloaded
    And the order should have status WAITING
    And the order should be at the end of the queue
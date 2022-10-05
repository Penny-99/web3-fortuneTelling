'reach 0.1';

const Player = {
  informTimeout: Fun([], Null),
  seeOutcome: Fun([Bool, UInt], Null),
};

export const main = Reach.App(() => {
  const Alice = Participant('Alice', {
    ...Player,
    wager: UInt, 
    deadline: UInt,
    getDecision: Fun([UInt], Bool),
  });

  const Bob   = Participant('Bob', {
    ...Player,
    acceptWager: Fun([UInt], Null),
    tellFortune: Fun([], UInt),
  });

  init();

  const informTimeout = () => {
    each([Alice, Bob], () => {
      interact.informTimeout();
    });
  };

  Alice.only(() => {
    const wager = declassify(interact.wager);
    const deadline = declassify(interact.deadline);
  });
  Alice.publish(wager, deadline)
    .pay(wager);
  commit();
  
  Bob.only(() => {
    interact.acceptWager(wager);
  });
  Bob.pay(wager)
    .timeout(relativeTime(deadline), () => closeTo(Alice, informTimeout));

  var outcome = false;
  invariant(balance() == 2 * wager)
  while (outcome == false){
    commit();
    Bob.only(() => {
        const fortuneBob = declassify(interact.tellFortune());
    });
    Bob.publish(fortuneBob)
        .timeout(relativeTime(deadline), () => closeTo(Alice, informTimeout));
    commit();
    Alice.only(() => {
      const decisionAlice = declassify(interact.getDecision(fortuneBob));
      });
    Alice.publish(decisionAlice)
      .timeout(relativeTime(deadline), () => closeTo(Bob, informTimeout));

    each([Alice, Bob], () => {
          interact.seeOutcome(decisionAlice, fortuneBob);
        });
    
    outcome = decisionAlice;
    continue;
  }
  
  assert(outcome == true);
  transfer(2*wager).to(Bob);
  commit();
  
});

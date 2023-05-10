export class MessageBus {
  constructor () {
    this.types = {};
  }

  register(type, func) {
    if (this.types[type] === undefined) {this.types[type] = [];}
    const index = this.types[type].push(func);
    // (index - 1) because the push method returns the length of the array
    return () => {delete this.types[type][index-1]};
  }

  send(type, data) {
    if(type in this.types) {
      for (const func of this.types[type]) {
        func(data);
      }
    }
  }
}

// this doesn't have a lot of error handling yet.
// don't: omit init inside the config, have states and transitions with the same name
// TODO decide if we need this
// export class StateMachine {
//   constructor(config, msgBus) {
//     if (!(msgBus instanceof MessageBus)) throw("Wrong object type! It should be a message bus.");
//     this.msgBus = msgBus;
//     this.state = config.init;
//     this.states = new Set();
//     for (const transition of config.transitions) {
//       this.states.add(transition.from).add(transition.to);
//       this[transition.name] = function (data) {
//         this.state = transition.to;
//         const transMsgName = "on" + transition.name;
//         const stateMsgName = "on" + transition.to;
//         this.msgBus.send(transMsgName, data);
//         this.msgBus.send(stateMsgName, data);
//       }
//     }
//   }
// }

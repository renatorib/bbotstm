Scripts = new Mongo.Collection("scripts");

if (Meteor.isServer) {
  Meteor.publish("scripts", function () {
    return Scripts.find({owner: this.userId});
  });
}

if (Meteor.isClient) {

  // helpers and methods

  Meteor.subscribe("scripts");

  var Helper = {};

  Helper.findScriptsByVoc = function(voc){
      var voc = voc || 'all';
      var obj = {}; 
      obj["vocation." + voc] = 1;
      var find = (voc == 'all' ? {} : obj);
      find['owner'] = Meteor.userId();
      var scripts = Scripts.find(find, {sort: {level: 1}});
      return scripts.count() > 0 ? scripts : false;
  }

  Helper.findAllScripts = function(){
      var scripts = Scripts.find({owner: Meteor.userId()}, {sort: {level: -1}});
      return scripts.count() > 0 ? scripts : false;
  }

  Helper.vocations = ['none', 'knight', 'paladin', 'sorcerer', 'druid'];

  // body

  Template.body.helpers({
    
  });

  Template.body.events({
    "submit .new-script": function (event) {

      // Retrieving data from form
      var t = $('.new-script');
      var level = t.find('.level').val();
      var name = t.find('.name').val();
      var thread = t.find('.thread').val();
      var vocation = {
        none: t.find('[value=n]').is(':checked') ? 1 : 0,
        knight: t.find('[value=k]').is(':checked') ? 1 : 0,
        paladin: t.find('[value=p]').is(':checked') ? 1 : 0,
        sorcerer: t.find('[value=s]').is(':checked') ? 1 : 0,
        druid: t.find('[value=d]').is(':checked') ? 1 : 0
      }

      if(!(vocation.none || vocation.knight || vocation.paladin || vocation.sorcerer || vocation.druid)){
        alert('Select 1 vocation at least.');
        return false;
      }

      if(level.length < 1){
        alert('Fill the miminum level field');
        return false;
      }

      if(name.length < 1){
        alert('Fill the name field');
        return false;
      }

      if(thread.length < 1){
        alert('Fill the thread id field');
        return false;
      }

      Meteor.call('addScript', level, name, thread, vocation);
      
      // clear form
      t.find('.level').val('');
      t.find('.name').val('');
      t.find('.thread').val('');

      // update elastic textarea
      $('.generate').elastic();

      // Prevent default form submit
      return false;
    }
  });

  // list 

  Template.list.helpers({
    ufirst: function(v){
      return v.charAt(0).toUpperCase() + v.slice(1);
    },
    vocs: function(){
      return Helper.vocations;
    },
    scripts: Helper.findAllScripts,
  });

  // vocation

  Template.vocation.helpers({
    ufirst: function(v){
      return v.charAt(0).toUpperCase() + v.slice(1);
    },
    maximized: function(voc){
      //Session.setDefaultPersistent(voc+'max', true);
      return Session.get(voc+'max');
    },
    scripts: Helper.findScriptsByVoc,
    have: function(obj){
      return (obj.count() > 0);
    }
  });

  Template.vocation.events({
    "click .title": function(e, t){
      var index = $(t.find('[data-voc]')).attr('data-voc')+'max';
      console.log(Session.get(index));
      return Session.setPersistent(index, !Session.get(index) || false);
    },
  });

  // script

  Template.script.events({
    "click .delete": function () {
      Meteor.call('deleteScript', this._id);
    },
    "mouseenter li": function(e, t){
      $('[data-id=' + $(t.find('li')).attr('data-id') + ']').addClass('hover');
    },
    "mouseleave li": function(e, t){
      $('[data-id=' + $(t.find('li')).attr('data-id') + ']').removeClass('hover');
    }
  });

  // generator

  Template.generate.rendered = function(){
    $('.generate').elastic();

    var elastic = setInterval(function(){
        $('.generate').trigger('update');
     }, 1000);

    $(".generate").focus(function() {
      var $this = $(this);
      $this.select();

      // Work around Chrome's little problem
      $this.mouseup(function() {
          // Prevent further mouseup intervention
          $this.unbind("mouseup");
          return false;
      });
  });
  }

  Template.generate.events({
    "click .generate": function(){

    }
  });

  Template.list_generate.helpers({
    ufirst: function(v){
      return v.charAt(0).toUpperCase() + v.slice(1);
    },
    vocs: function(){
      return Helper.vocations;
    },
    scripts: Helper.findScriptsByVoc
  })

  // accounts

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

}

Meteor.methods({
  addScript: function (level, name, thread, vocation) {

    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Scripts.insert({
      owner: Meteor.userId(),
      username: Meteor.user().username,
      level: level,
      name: name,
      thread: thread,
      vocation: vocation,
      createdAt: new Date() // current time
    });

  },
  deleteScript: function (id) {
    return Scripts.remove(id);
  }
});
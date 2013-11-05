(function(g){
  var DBUtil = {
    getData: function(aName, p, v){
      var a = storage.get(aName);
      var index = $.inArray(v, $.map(a, function(o){return o[p];}));
      if (index < 0){
        return null;
      } else {
        return a[index];
      }
    },
    queryData: function(aName, p, v){
      var a = storage.get(aName);
      var vArray = $.isArray(v) ? v : [v];
      return $.map(vArray, function(ov, iv){
        return $.grep(a, function(oa, ia){
          return (ov === oa[p])
        });
      });
    },
    rmData: function(aName, p, v){
      var a = storage.get(aName);
      var vArray = $.isArray(v) ? v : [v];
      storage.set(aName, $.grep(a, function(o, i){var r = true; for (var k = 0; k < vArray.length; k ++){r = r && (vArray[k] !== o[p]);} return r;}));
      // refresh DB
      DB[aName] = storage.get(aName);
    },
    addLog: function(log, u){
      var logs = storage.get("logs") || [];
      logs.push({user: u || g.UserUtil.getActUser(), content: log, time: $.now()});
      storage.set("logs", logs);
      return logs;
    }
  };
  g.DBUtil = DBUtil;

  var userUtil = {
    isUserNameExisted: function(name){
      return $.inArray(name, $.map(g.DB.users, function(u){return u.name;})) > -1 ? true : false;
    }, 
    getUserByName: function(name){
      var index = $.inArray(name, $.map(g.DB.users, function(u){return u.name;}));
      if (index < 0){
        return false;
      } else {
        return g.DB.users[index];
      }
    },
    addUser: function(u){
      DB.users.push({
        id: u.id || $.now(),
        name: u.name,
        pwd: u.pwd,
        role: g.DBUtil.queryData("roles", "code", u.role),
        st: u.st === undefined ? 1 : 0
      });
      storage.set("users", DB.users);
      // console.log(storage.get("users"));
    },
    signin: function(u){
      storage.set("actUser", u);
      window.location.href = "./user-list.html";
    }
  };
  g.UserUtil = userUtil;


  var DB = {};
  DB.roles = [{code: "root", name: "超级管理员"},
              {code: "admin", name: "管理员"},
              {code: "cUser", name: "普通用户（无xenserver权限）"},
              {code: "xenUser", name: "xenserver用户"}];
  storage.set("roles", DB.roles);
  g.DB = DB;
  // if need to empty the localstorage.
  // storage.empty();

  // Data struct like [{name: "admin", pwd: "admin"}...]
  // st is a state for the data.
  DB.users = [];
  var adminUser = {
    id: 1,
    name: "admin",
    pwd: "admin",
    role: "root"
  };

  // DB.users = [
  //   {name: "admin", pwd: "admin"},
  //   {name: "a", pwd: "a"},
  //   {name: "c", pwd: "c"}
  // ];

  var _users = storage.get("users");
  if ($.isEmptyObject(_users)){
    g.UserUtil.addUser(adminUser);
    g.UserUtil.addUser({id: 2, name: "zza", pwd: "zza", role: "admin"});
    g.UserUtil.addUser({id: 3, name: "zhm", pwd: "zhm", role: ["admin", "xenUser"]});
    g.UserUtil.addUser({id: 4, name: "jack", pwd: "jack", role: "xenUser", st: 0});
    g.UserUtil.addUser({id: 5, name: "tom", pwd: "tom", role: "cUser"});
  } else {
    DB.users = _users;
  }

  // show the localStroge content.
  // console.log(storage.get("users"));
  $(function(){
    var alertObj = $("#alert-signin");

    $("#form-signin").delegate("input", "focus", function(){
      alertObj.hide();
    });
    $("#form-signin").delegate("input", "keydown", function(e){
      if(e.keyCode == 13){
        $("#btn-signin").click();
      }
    });

    $("#btn-signin").click(function(){
      var uName = $("#uName").val();
      var uPwd = $("#uPwd").val();

      if ($.isEmptyObject(uName) || $.isEmptyObject(uPwd)){
        alertObj.text("请输入用户名和密码");
      } else {
        var user = g.UserUtil.getUserByName(uName);
        if (!user){
          alertObj.text("用户不存在");
        } else if (uPwd !== user.pwd) {
          alertObj.text("密码不正确");
        } else if (uPwd === user.pwd && user.st === 0) {
          alertObj.text("用户已被禁用，请联系管理员。");
        } else if(uPwd === user.pwd && user.st === 1){
          g.DBUtil.addLog("用户登录系统", user);
          g.UserUtil.signin(user);
          return true;
        }
      }
      alertObj.show();
    });
  });
})(window);


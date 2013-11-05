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
    addLog: function(log){
      var logs = storage.get("logs") || [];
      logs.push({user: g.UserUtil.getActUser(), content: log, time: $.now()});
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
    },
    signout: function(){
      g.DBUtil.addLog("用户退出系统");
      storage.empty();
      window.location.href = "./user-list.html";
    },
    getActUser: function(){
      var u = storage.get("actUser");
      if (u){
        return u;
      } else {
        window.location.href = "./index.html"
      }
    }
  };
  g.UserUtil = userUtil;


  var DB = {};
  g.DB = DB;
  DB.actUser = g.UserUtil.getActUser();

  DB.users = storage.get("users");
  DB.roles = storage.get("roles");

  var uRoleArray = $.map(DB.actUser.role, function(r, i){return r.code;});

  $(function(){
    // show user name
    $("#actUserName").text(DB.actUser.name || "用户名");

    // bind the signout button, user click can signout.
    $("#btn-signout").click(function(){
      g.UserUtil.signout();
    });

    // refresh the user list.
    var funShowUserList = function(){
      var userListContainer = $("#list-user");
      userListContainer.empty().append(($.map(DB.users, function(u, index){
        return "<tr><td>" + (index - 0 + 1) + "</td><td>" + u.name + "</td><td>" 
                + ($.map(u.role, function(o, i){return o.name;}).join(" | ")) + "</td><td class=\"" 
                + (u.st==1 ? "is-valid" : "is-forbidden") + "\">" + (u.st==1 ? "可用" : "已禁用") + "</td><td>" 
                + ((u.name == DB.actUser.name || "admin" == u.name || ($.inArray("root", uRoleArray) < 0)) ? "" : "<button id=\"" + u.id + "\" class=\"btn btn-default btn-xs\">删除</button>") + "</td></tr>";
      })).join(""));
    };

    // bind the user tab 
    $("#tabs-user").on('shown.bs.tab', function (e) {
      // e.target // activated tab
      // e.relatedTarget // previous tab
      
      // is the user list panel
      if (e.target.href.indexOf("panel-2") > 0){
        funShowUserList();
        g.DBUtil.addLog("浏览用户列表");
      } else if (e.target.href.indexOf("panel-3") > 0){
        $("#list-log").empty().append(($.map(storage.get("logs"), function(l, index){
          return "<tr><td>" + (index - 0 + 1) + "</td><td>" + l.user.name + "</td><td>" 
                  + l.content + "</td><td>" + (new Date(l.time)).toLocaleString() +"</td></tr>";
        })).join(""));
        // g.DBUtil.addLog("浏览用户日志");
      }
    });

    // show the roles select options list
    $("#uRole").empty().append(($.map(storage.get("roles"),function(o, index){
      return "<option value=\"" + o.code + "\">" + o.name + "</option>";
    })).join(""));

    // for the form of adding user.
    var alertObj = $("#alert-signin");

    $("#form-addUser").delegate("input, select", "focus", function(){
      alertObj.hide();
    });
    $("#form-addUser").delegate("input, select", "keydown", function(e){
      if(e.keyCode == 13){
        $("#btnAddUser").click();
      }
    });
    $("#btnAddUser").click(function(){
      var uName = $("#uName").val();
      var uPwd = $("#uPwd").val();
      var uRole = $("#uRole").val();

      if ($.isEmptyObject(uName) || $.isEmptyObject(uPwd)){
        alertObj.text("请输入用户名和密码");
      } else {
        var user = g.UserUtil.getUserByName(uName);
        if ($.isEmptyObject(uRole)){
          alertObj.text("请选择用户角色");
        } else if (user) {
          alertObj.text("用户名已存在");
        } else {
          g.UserUtil.addUser({name: uName, pwd: uPwd, role: uRole});
          g.DBUtil.addLog("增加新用户 " + uName);
          funShowUserList();
          (function(){
            $("#uName").val("");
            $("#uPwd").val("");
            $("#uRole").val("");
          })();
          $("#addUserModal").modal('hide');
          return true;
        }
      }
      alertObj.show();
    });

    // remove the user
    var toRmUserId = 0;
    // DBUtil.rmData("users", "id", (e.target.id - 0));
    // funShowUserList();
    $("#list-user").delegate("button", "click", function(e){
      // console.log(e);
      toRmUserId = e.target.id - 0;
      $("#confirm-rmUser").modal("show");
    }); 

    $("#doRmUser").click(function(){
      g.DBUtil.addLog("删除用户 id:" + toRmUserId);
      DBUtil.rmData("users", "id", toRmUserId);
      funShowUserList();
      $("#confirm-rmUser").modal("hide");
    });

    $('#confirm-rmUser').on('hidden.bs.modal', function () {
      toRmUserId = 0;
    });


    // 权限管理
    

    if ($.inArray("root", uRoleArray) > -1){
      $("#btn-addUser").show();
    }
    
    if ($.inArray("root", uRoleArray) > -1 || $.inArray("admin", uRoleArray) > -1){
      $("#UAMS").show();
    }

    if ($.inArray("root", uRoleArray) > -1 || $.inArray("admin", uRoleArray) > -1 || $.inArray("xenUser", uRoleArray) > -1){
      $("#XSMS").show();
    }

  });
})(window);


var User = require("../models/user");
var Diagram = require("../models/diagram");
var jwt = require("jsonwebtoken");
var secret = process.env.SECRET;
var ObjectId = require("mongodb").ObjectID;
var nodemailer = require("nodemailer");
// var sgTransport = require('nodemailer-sendgrid-transport');
var helper = require("sendgrid").mail;
var sg = require("sendgrid")(process.env.SENDGRID_API_KEY);
var port = process.env.PORT || 3000;

module.exports = function(router) {
  //senging email by sendgrid
  var fromEmail = new helper.Email("jirayuth.si.56@ubu.ac.th");

  var diagramTested = [];

  //http://localhost:3000/api/users
  //user register route
  router.post("/users", function(req, res) {
    var user = new User(req.body);
    user.temporarytoken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name
      },
      secret,
      { expiresIn: "24h" }
    );
    // If statement to ensure request it not empty or null
    if (
      req.body.username == null ||
      req.body.username == "" ||
      req.body.password == null ||
      req.body.password == "" ||
      req.body.email == null ||
      req.body.email == "" ||
      req.body.name == null ||
      req.body.name == ""
    ) {
      res.json({
        success: false,
        message: "กรุณาตรวจสอบรหัสผู้ใช้ อีเมล และรหัสผ่าน"
      });
    } else {
      // If criteria is met, save user to database
      user.save(function(err) {
        if (err) {
          if (err.errors != null) {
            if (err.errors.name) {
              res.json({ success: false, message: err.errors.name.message });
            } else if (err.errors.email) {
              res.json({ success: false, message: err.errors.email.message });
            } else if (err.errors.username) {
              res.json({
                success: false,
                message: err.errors.username.message
              });
            } else if (err.errors.password) {
              res.json({
                success: false,
                message: err.errors.password.message
              });
            } else {
              res.json({ success: false, message: err });
            }
          } else if (err) {
            // Check if duplication error exists
            if (err.code == 11000) {
              if (err.errmsg[61] == "u") {
                res.json({
                  success: false,
                  message: "รหัสผู้ใช้นี้มีผู้ใช้งานแล้ว"
                }); // Display error if username already taken
              } else if (err.errmsg[61] == "e") {
                res.json({
                  success: false,
                  message: "อีเมลนี้มีผู้ใช้งานแล้ว"
                }); // Display error if e-mail already taken
              }
            } else {
              res.json({ success: false, message: err }); // Display any other error
            }
          }
        } else {
          // Function to send e-mail to the user
          var toEmail = new helper.Email(user.email);
          var subject = "ลิงก์ยืนยันการสมัครสมาชิกของคุณ";
          var txt =
            "สวัสดีคุณ<strong> " +
            user.name +
            '</strong>,<br><br>ขอบคุณสำหรับการสมัครสมาชิกที่ localhost.com. กรุณากดลิงค์ส่งมาเพื่อยืนยันการสมัครสมาชิกของคุณ:<br><br><a href="http://localhost/activate/' +
            user.temporarytoken +
            '">http://localhost/activate/</a>';
          var content = new helper.Content("text/html", txt);
          var mail = new helper.Mail(fromEmail, subject, toEmail, content);

          var request = sg.emptyRequest({
            method: "POST",
            path: "/v3/mail/send",
            body: mail.toJSON()
          });

          sg.API(request, function(error, response) {
            if (error) {
              console.log("Error response received");
            } else {
              console.log("yes");
              res.json({
                success: true,
                message:
                  "สมัครสมาชิกเรียบร้อยแล้ว กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันการสมัครสมรชิก"
              }); // If all criteria met, save user
            }
          });
        }
      });
    }
  });

  router.post("/checkusername", function(req, res) {
    User.findOne({ username: req.body.username })
      .select("username")
      .exec(function(err, user) {
        if (err) throw err;

        if (user) {
          res.json({
            success: false,
            message: "รหัสผู้ใช้งานนี้มีผู้ใช้งานแล้ว"
          });
        } else {
          console.log(typeof user);
          res.json({ success: true, message: "รหัสผู้ใช้งานใช้งานได้" });
        }
      });
  });

  router.post("/checkemail", function(req, res) {
    User.findOne({ email: req.body.email })
      .select("email")
      .exec(function(err, user) {
        if (err) throw err;

        if (user) {
          res.json({ success: false, message: "อีเมลนี้มีผู้ใช้งานแล้ว" });
        } else {
          res.json({ success: true, message: "อีเมลนี้ใช้งานได้" });
        }
      });
  });

  //http://localhost:3000/api/authenticate
  //user login route
  router.post("/authenticate", function(req, res) {
    User.findOne({ username: req.body.username })
      .select("_id name email username password active")
      .exec(function(err, user) {
        if (err) throw err;

        if (!user) {
          res.json({
            success: false,
            message: "ไม่มีข้อมูลผู้ใช้ในระบบ กรุณาตรวจสอบข้อมูล"
          });
        } else if (user) {
          if (req.body.password) {
            //chk
            var validPassword = user.comparePassword(req.body.password);
          } else {
            res.json({ success: false, message: "กรุณาตรวจสอบข้อมูลรหัสผ่าน" });
          }
          if (!validPassword) {
            res.json({
              success: false,
              message: "รหัสผ่านไม่ถูกต้องกรุณาตรวจสอบข้อมูล"
            });
          } else if (!user.active) {
            res.json({
              success: false,
              message:
                "บัญชีของคุณยังไม่มีการยืนยันการสมัครสมาชิก กรุณาตรวจสอบอีเมลของคุณ",
              expired: true
            }); // Account is not activated
          } else {
            var token = jwt.sign(
              {
                id: user._id,
                username: user.username,
                email: user.email,
                name: user.name
              },
              secret,
              { expiresIn: "24h" }
            );

            res.json({
              success: true,
              message: "กำลังตรวจสอบข้อมูลผู้ใช้!",
              token: token
            });
          }
        }
      });
  });

  router.put("/activate/:token", function(req, res) {
    User.findOne({ temporarytoken: req.params.token }, function(err, user) {
      if (err) throw err;
      var token = req.params.token;

      //verify token
      jwt.verify(token, secret, function(err, decoded) {
        if (err) {
          res.json({
            success: false,
            message: "ลิงก์การยืนยันสมาชิกหมดอายุการใช้งาน"
          });
        } else if (!user) {
          res.json({
            success: false,
            message: "ลิงก์การยืนยันสมาชิกหมดอายุการใช้งาน"
          });
        } else {
          user.temporarytoken = false;
          user.active = true;
          user.save(function(err) {
            if (err) {
              console.log(err);
            } else {
              // Function to send e-mail to the user
              var toEmail = new helper.Email(user.email);
              var subject = "Localhost ยืนยันการสมัครสมาชิก";
              var txt =
                "สวัสดีคุณ <strong>" +
                user.name +
                "</strong>บัญชีของคุณได้ทำการยืนยันการสมัครสมาชิกเรียบร้อยแล้ว!";
              var content = new helper.Content("text/html", txt);
              var mail = new helper.Mail(fromEmail, subject, toEmail, content);

              var request = sg.emptyRequest({
                method: "POST",
                path: "/v3/mail/send",
                body: mail.toJSON()
              });

              sg.API(request, function(error, response) {
                if (error) {
                  console.log("Error response received");
                } else {
                  res.json({
                    success: true,
                    message: "ยืนยันการสมัครสมาชิกเรียบร้อยแล้ว!"
                  });
                }
              });
            }
          });
        }
      });
    });
  });

  // Route to verify user credentials before re-sending a new activation link
  router.post("/resend", function(req, res) {
    User.findOne({ username: req.body.username })
      .select("username password active")
      .exec(function(err, user) {
        if (err) throw err; // Throw error if cannot connect

        // Check if username is found in database
        if (!user) {
          res.json({ success: false, message: "กรุณาตรวจสอบรหัสผู้ใช้งาน" }); // Username does not match username found in database
        } else if (user) {
          // Check if password is sent in request
          if (req.body.password) {
            var validPassword = user.comparePassword(req.body.password); // Password was provided. Now check if matches password in database
            if (!validPassword) {
              res.json({ success: false, message: "กรุณาตรวจสอบรหัสผ่าน" }); // Password does not match password found in database
            } else if (user.active) {
              res.json({
                success: false,
                message: "บัญชีของคุณได้รับการยืนยันการเป็นสมาชิกแล้ว"
              }); // Account is already activated
            } else {
              res.json({ success: true, user: user });
            }
          } else {
            res.json({ success: false, message: "กรุณาตรวจสอบข้อมูลรหัสผ่าน" }); // No password was provided
          }
        }
      });
  });

  // Route to send user a new activation link once credentials have been verified
  router.put("/resend", function(req, res) {
    User.findOne({ username: req.body.username })
      .select("username name email temporarytoken")
      .exec(function(err, user) {
        if (err) throw err; // Throw error if cannot connect
        user.temporarytoken = jwt.sign(
          { username: user.username, email: user.email },
          secret,
          { expiresIn: "24h" }
        ); // Give the user a new token to reset password
        // Save user's new token to the database
        user.save(function(err) {
          if (err) {
            console.log(err); // If error saving user, log it to console/terminal
          } else {
            // If user successfully saved to database, create e-mail object
            // Function to send e-mail to the user
            var toEmail = new helper.Email(user.email);
            var subject = "Localhost ร้องของลิงก์การยืนยันเป็นสมาชิก";
            var txt =
              "สวัสดีคุณ<strong> " +
              user.name +
              '</strong>,<br><br>เมื่อไม่นานมานี้คุณได้ทำการร้องของลิงก์สำหรับการยืนยันการเป็นสมาชิก โปรดกดลิงก์ด้านล่างเพื่อดำเนินการยืนยืนการเป็นสมาชิก:<br><br><a href="http://localhost/activate/' +
              user.temporarytoken +
              '">http://localhost/activate/</a>';
            var content = new helper.Content("text/html", txt);
            var mail = new helper.Mail(fromEmail, subject, toEmail, content);

            var request = sg.emptyRequest({
              method: "POST",
              path: "/v3/mail/send",
              body: mail.toJSON()
            });

            sg.API(request, function(error, response) {
              if (error) {
                console.log("Error response received");
              } else {
                res.json({
                  success: true,
                  message:
                    "ส่งลิงก์การยืนยันการสมัครสมาชิกไปที่ " +
                    user.email +
                    "เรียบร้อย!"
                }); // Return success message to controller
              }
            });
          }
        });
      });
  });

  // Route to send user's username to e-mail
  router.get("/resetusername/:email", function(req, res) {
    User.findOne({ email: req.params.email })
      .select("email name username")
      .exec(function(err, user) {
        if (err) {
          res.json({ success: false, message: err }); // Error if cannot connect
        } else {
          if (!user) {
            res.json({ success: false, message: "ไม่พบข้อมูลอีเมลในระบบ" }); // Return error if e-mail cannot be found in database
          } else {
            // If e-mail found in database, create e-mail object
            // Function to send e-mail to the user
            var toEmail = new helper.Email(user.email);
            var subject = "ร้องขอรหัสผู้ใช้งานจาก Localhost";
            var txt =
              "สวัสดีคุณ<strong> " +
              user.name +
              "</strong>,<br><br>, เมื่อไม่นานมานี้คุณได้ร้องขอรหัสผู้ใช้งานของคุณ โปรดเก็บรหัสผู้ใช้งานของคุณไว้ :: " +
              user.username;
            var content = new helper.Content("text/html", txt);
            var mail = new helper.Mail(fromEmail, subject, toEmail, content);

            var request = sg.emptyRequest({
              method: "POST",
              path: "/v3/mail/send",
              body: mail.toJSON()
            });

            sg.API(request, function(error, response) {
              if (error) {
                console.log("Error response received");
              } else {
                res.json({
                  success: true,
                  message: "ส่งรหัสผู้ใช้งานไปที่อีเมลของคุณแล้ว! "
                }); // Return success message once e-mail has been sent
              }
            });
          }
        }
      });
  });

  // Route to send reset link to the user
  router.put("/resetpassword", function(req, res) {
    User.findOne({ username: req.body.username })
      .select("username active email resettoken name")
      .exec(function(err, user) {
        if (err) throw err; // Throw error if cannot connect
        if (!user) {
          res.json({
            success: false,
            message: "ไม่พบข้อมูลรหัสผู้ใช้งานในระบบ"
          }); // Return error if username is not found in database
        } else if (!user.active) {
          res.json({
            success: false,
            message: "บัญชีของคุณยังไม่ยืนยันการสมัครสมาชิก"
          }); // Return error if account is not yet activated
        } else {
          user.resettoken = jwt.sign(
            { username: user.username, email: user.email },
            secret,
            { expiresIn: "24h" }
          ); // Create a token for activating account through e-mail
          // Save token to user in database
          user.save(function(err) {
            if (err) {
              res.json({ success: false, message: err }); // Return error if cannot connect
            } else {
              // Function to send e-mail to the user
              var toEmail = new helper.Email(user.email);
              var subject = "Localhost ร้องขอการตั้งรหัสผ่านใหม่";
              var txt =
                "สวัสดีคุณ<strong> " +
                user.name +
                '</strong>,<br><br>เมื่อไม่นานมานี้คุณได้ร้องขอการตั้งรหัสผ่านใหม่ โปรดกดที่ลิงก์ข้างล่างเพื่อตั้งรหัสผ่านใหม่ของคุณ:<br><br><a href="http://localhost/reset/' +
                user.resettoken +
                '">http://localhost/reset/</a>';
              var content = new helper.Content("text/html", txt);
              var mail = new helper.Mail(fromEmail, subject, toEmail, content);

              var request = sg.emptyRequest({
                method: "POST",
                path: "/v3/mail/send",
                body: mail.toJSON()
              });

              sg.API(request, function(error, response) {
                if (error) {
                  console.log("Error response received");
                } else {
                  res.json({
                    success: true,
                    message: "โปรดตรวจสอบอีเมลของคุณเพื่อตั้งรหัสผ่านใหม่"
                  }); // Return success message
                }
              });
            }
          });
        }
      });
  });

  // Route to verify user's e-mail activation link
  router.get("/resetpassword/:token", function(req, res) {
    User.findOne({ resettoken: req.params.token })
      .select()
      .exec(function(err, user) {
        if (err) throw err;
        var token = req.params.token;
        jwt.verify(token, secret, function(err, decoded) {
          if (err) {
            res.json({
              success: false,
              message: "ลิงก์การตั้งรหัสผ่านใหม่หมดอายุการใช้งาน"
            }); // Token has expired or is invalid
          } else {
            if (!user) {
              res.json({
                success: false,
                message: "ลิงก์การตั้งรหัสผ่านใหม่หมดอายุการใช้งาน"
              }); // Token is valid but not no user has that token anymore
            } else {
              res.json({ success: true, user: user }); // Return user object to controller
            }
          }
        });
      });
  });

  // Save user's new password to database
  router.put("/savepassword", function(req, res) {
    User.findOne({ username: req.body.username })
      .select("username email name password resettoken")
      .exec(function(err, user) {
        if (err) throw err; // Throw error if cannot connect
        if (req.body.password == null || req.body.password == "") {
          res.json({ success: false, message: "กรุณาตรวจสอบข้อมูลรหัสผ่าน" });
        } else {
          user.password = req.body.password; // Save user's new password to the user object
          user.resettoken = false; // Clear user's resettoken
          // Save user's new data
          user.save(function(err) {
            if (err) {
              res.json({ success: false, message: err });
            } else {
              // Function to send e-mail to the user
              var toEmail = new helper.Email(user.email);
              var subject = "Localhost ตั้งรหัสผ่านใหม่";
              var txt =
                "สวัสดีคุณ<strong> " +
                user.name +
                "</strong>,<br><br>นี่คืออีเมลแจ้งเตือนที่คุณได้ทำการตั้งรหัสผ่านใหม่เมื่อไม่นานมานี้ที่ localhost.com";
              var content = new helper.Content("text/html", txt);
              var mail = new helper.Mail(fromEmail, subject, toEmail, content);

              var request = sg.emptyRequest({
                method: "POST",
                path: "/v3/mail/send",
                body: mail.toJSON()
              });

              sg.API(request, function(error, response) {
                if (error) {
                  console.log("Error response received");
                } else {
                  res.json({
                    success: true,
                    message: "ตั้งรหัสผ่านใหม่เรียบร้อย!"
                  }); // Return success message
                }
              });
            }
          });
        }
      });
  });

  //save diagram route
  router.post("/creatrDiag", function(req, res) {
    var diagram = new Diagram(req.body);
    if (req.body.name == null || req.body.name == "") {
      res.json({
        success: false,
        message: "กรุณากรอกข้อมูลชื่อโจทย์ปัญหาโครงงาน"
      });
    } else {
      diagram.save(function(err, diagram) {
        if (err) {
          res.json({ success: false, message: "บันทึกแผนผังไม่สำเสร็จ" }); // Display any other error
        } else {
          User.findByIdAndUpdate(
            req.body.userID,
            { $push: { diagram: diagram._id } },
            function(err, user) {
              if (err) {
                res.json({ success: false, message: "บันทึกแผนผังไม่สำเสร็จ" }); // Display any other error
              } else {
                res.json({
                  id: diagram._id,
                  success: true,
                  message: "บันทึกแผนผังเสร็จเรียบร้อย"
                });
              }
            }
          );
        }
      });
    }
  });

  //update diagram route
  router.put("/updateDiag", function(req, res) {
    Diagram.findById(req.body.id, function(err, diagram) {
      if (err) {
        res.json({ success: false, message: "แก้ไขแผนผังไม่สำเสร็จ" });
      } else {
        diagram.name = req.body.name;
        diagram.diagramDetail = req.body.diagramDetail;
        diagram.updated = Date();
        diagram.save(function(err) {
          if (err)
            res.json({ success: false, message: "แก้ไขแผนผังไม่สำเสร็จ" });

          res.json({ success: true, message: "แก้ไขแผนผังเสร็จเรียบร้อย" });
        });
      }
    });
  });
  // get diagram name route
  router.get("/getDiagName/:id", function(req, res) {
    User.findById(req.params.id, function(err, user) {
      if (err) {
        res.redirect("/");
        throw err;
      }

      if (user.permission === "admin") {
        Diagram.find({}, function(err, diagram) {
          if (err) throw err;

          for (var key in diagram) {
            diagram[key].diagramDetail = undefined;
          }
          res.json(diagram);
        });
      } else {
        Diagram.find({ _id: { $in: user.diagram } }, function(err, diagram) {
          if (err) throw err;

          for (var key in diagram) {
            diagram[key].diagramDetail = undefined;
          }
          res.json(diagram);
        });
      }
    });
  });
  //

  router.get("/getDiagram", function(req, res) {
    Diagram.find({}, function(err, diagram) {
      if (err) throw err;

      for (var key in diagram) {
        diagram[key].diagramDetail = undefined;
      }
      res.json(diagram);
    });
  });

  // get diagram by id route
  router.get("/getDiag/:id", function(req, res) {
    console.log("ID", req.params.id);

    Diagram.findById(req.params.id, function(err, diagram) {
      if (err) throw err;

      res.json(diagram);
    });
  });
  // remove diagram
  router.delete("/delete", function(req, res) {
    Diagram.remove({ _id: req.query.diagId }, function(err, digram) {
      if (err) {
        res.json({ success: false, message: "ลบแผนผังไม่สำเร็จ" });
      } else {
        User.update(
          {
            _id: ObjectId(req.query.userId)
          },
          {
            $pull: { diagram: ObjectId(req.query.diagId) }
          },
          {
            multi: false, // update only one document
            upsert: false // insert a new document, if no existing document match the query
          },
          function(err, user) {
            if (err) {
              res.json({ success: false, message: "ลบแผนผังไม่สำเร็จ" });
            } else {
              res.json({ success: true, message: "ลบแผนผังเสร็จเรียบร้อย" });
            }
          }
        );
      }
    });
  });
  // to get next test diagram
  router.get("/toGetDiagramTest/:id", function(req, res) {
    var diagramId = req.params.id;
    diagramTested.push(diagramId);

    Diagram.find({ _id: { $not: { $in: diagramTested } } }, function(
      err,
      diagram
    ) {
      if (err) throw err;

      if (err) {
        res.json({
          success: false,
          message: "คุณได้ทำแบบทดสอบทั้งหมดเรียบร้อย"
        });
      } else {
        res.json({ success: true, diagram: diagram[0]._id });
      }
    });
  });

  router.use(function(req, res, next) {
    var token =
      req.body.token || req.body.query || req.headers["x-access-token"];

    if (token) {
      //verify token
      jwt.verify(token, secret, function(err, decoded) {
        if (err) {
          res.json({ success: false, message: "กรุณาเข้าสู้ระบบใหม่อีกครั้ง" }); //Token invalid
        } else {
          req.decoded = decoded;
          next();
        }
      });
    } else {
      res.json({ success: false, message: "กรุณาเข้าสู้ระบบใหม่อีกครั้ง" }); //No token provided
    }
  });

  router.post("/me", function(req, res) {
    res.send(req.decoded);
  });

  // Route to provide the user with a new token to renew session
  router.get("/renewToken/:username", function(req, res) {
    User.findOne({ username: req.params.username })
      .select("username email")
      .exec(function(err, user) {
        if (err) throw err; // Throw error if cannot connect
        // Check if username was found in database
        if (!user) {
          res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งาน" }); // Return error
        } else {
          var newToken = jwt.sign(
            { username: user.username, email: user.email },
            secret,
            { expiresIn: "24h" }
          ); // Give user a new token
          res.json({ success: true, token: newToken }); // Return newToken in JSON object to controller
        }
      });
  });

  // Route to get the current user's permission level
  router.get("/permission", function(req, res) {
    User.findOne({ username: req.decoded.username }, function(err, user) {
      if (err) throw err; // Throw error if cannot connect
      // Check if username was found in database
      if (!user) {
        res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งาน" }); // Return an error
      } else {
        res.json({ success: true, permission: user.permission }); // Return the user's permission
      }
    });
  });

  // Route to get all users for management page
  router.get("/management", function(req, res) {
    User.find({}, function(err, users) {
      if (err) throw err; // Throw error if cannot connect
      User.findOne({ username: req.decoded.username }, function(err, mainUser) {
        if (err) throw err; // Throw error if cannot connect
        // Check if logged in user was found in database
        if (!mainUser) {
          res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งานของคุณ" }); // Return error
        } else {
          // Check if user has editing/deleting privileges
          if (mainUser.permission === "admin") {
            // Check if users were retrieved from database
            if (!users) {
              res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งาน" }); // Return error
            } else {
              res.json({
                success: true,
                users: users,
                permission: mainUser.permission
              }); // Return users, along with current user's permission
            }
          } else {
            res.json({
              success: false,
              message: "สิทธิ์การเข้าใช้งานไม่เพียงพอในการแก้ไขข้มูล"
            }); // Return access error
          }
        }
      });
    });
  });

  // Route to delete a user
  router.delete("/management/:username", function(req, res) {
    var deletedUser = req.params.username;
    User.findOne({ username: req.decoded.username }, function(err, mainUser) {
      if (err) throw err;
      if (!mainUser) {
        res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งานของคุณ" }); // Return error
      } else {
        if (mainUser.permission !== "admin") {
          res.json({
            success: false,
            message: "สิทธิ์การเข้าใช้งานไม่เพียงพอในการแก้ไขข้มูล"
          }); // Return error
        } else {
          User.findOneAndRemove({ username: deletedUser }, function(err, user) {
            if (err) throw err;
            res.json({ success: true });
          });
        }
      }
    });
  });

  // Route to get the user that needs to be edited
  router.get("/edit/:id", function(req, res) {
    var editUser = req.params.id; // Assign the _id from parameters to variable
    User.findOne({ username: req.decoded.username }, function(err, mainUser) {
      if (err) throw err; // Throw error if cannot connect
      // Check if logged in user was found in database
      if (!mainUser) {
        res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งานของคุณ" }); // Return error
      } else {
        // Check if logged in user has editing privileges
        if (mainUser.permission === "admin") {
          // Find the user to be editted
          User.findOne({ _id: editUser }, function(err, user) {
            if (err) throw err; // Throw error if cannot connect
            // Check if user to edit is in database
            if (!user) {
              res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งาน" }); // Return error
            } else {
              res.json({ success: true, user: user }); // Return the user to be editted
            }
          });
        } else {
          res.json({
            success: false,
            message: "สิทธิ์การเข้าใช้งานไม่เพียงพอในการแก้ไขข้มูล"
          }); // Return access error
        }
      }
    });
  });

  // Route to update/edit a user
  router.put("/edit", function(req, res) {
    var editUser = req.body._id;
    if (req.body.name) var newName = req.body.name;
    if (req.body.username) var newUsername = req.body.username;
    if (req.body.email) var newEmail = req.body.email;
    if (req.body.permission) var newPermission = req.body.permission;
    User.findOne({ username: req.decoded.username }, function(err, mainUser) {
      if (err) throw err;
      if (!mainUser) {
        res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งานของคุณ" });
      } else {
        if (newName) {
          if (mainUser.permission === "admin") {
            User.findOne({ _id: editUser }, function(err, user) {
              if (err) throw err;
              if (!user) {
                res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งาน" }); // Return error
              } else {
                user.name = newName;
                user.save(function(err) {
                  if (err) {
                    console.log(err);
                  } else {
                    res.json({
                      success: true,
                      message: "บันทึกช้อมูลชื่อผู้ใช้งานเสร็จเรียบร้อย!"
                    });
                  }
                });
              }
            });
          } else {
            res.json({
              success: false,
              message: "สิทธิ์การเข้าใช้งานไม่เพียงพอในการแก้ไขข้มูล"
            }); // Return error
          }
        }

        if (newUsername) {
          if (mainUser.permission === "admin") {
            User.findOne({ _id: editUser }, function(err, user) {
              if (err) throw err;
              if (!user) {
                res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งาน" }); // Return error
              } else {
                user.username = newUsername;
                user.save(function(err) {
                  if (err) {
                    console.log(err);
                  } else {
                    res.json({
                      success: true,
                      message: "บันทึกช้อมูลรหัสผู้ใช้งานเสร็จเรียบร้อย"
                    });
                  }
                });
              }
            });
          } else {
            res.json({
              success: false,
              message: "สิทธิ์การเข้าใช้งานไม่เพียงพอในการแก้ไขข้มูล"
            }); // Return error
          }
        }

        if (newEmail) {
          if (mainUser.permission === "admin") {
            User.findOne({ _id: editUser }, function(err, user) {
              if (err) throw err;
              if (!user) {
                res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งาน" }); // Return error
              } else {
                user.email = newEmail;
                user.save(function(err) {
                  if (err) {
                    console.log(err); // Log error to console
                  } else {
                    res.json({
                      success: true,
                      message: "บันทึกช้อมูลอีเมลผู้ใช้งานเสร็จเรียบร้อย"
                    }); // Return success
                  }
                });
              }
            });
          } else {
            res.json({
              success: false,
              message: "สิทธิ์การเข้าใช้งานไม่เพียงพอในการแก้ไขข้มูล"
            }); // Return error
          }
        }

        if (newPermission) {
          if (mainUser.permission === "admin") {
            User.findOne({ _id: editUser }, function(err, user) {
              if (err) throw err;
              if (!user) {
                res.json({ success: false, message: "ไม่พบข้อมูลผู้ใช้งาน" });
              } else {
                if (newPermission === "user") {
                  if (user.permission === "admin") {
                    if (mainUser.permission !== "admin") {
                      res.json({
                        success: false,
                        message:
                          "สิทธิ์การเข้าใช้งานไม่เพียงพอในการเปลี่ยนแปลงสิทธิ์ผู้เข้าใช้งาน คุณต้องเป็นผู้ดูแลระบบถึงจะสามารถกำหนดผู้ใช้งานอื่นเป็นผู้ดูและระบบได้"
                      });
                    } else {
                      user.permission = newPermission;
                      // Save changes
                      user.save(function(err) {
                        if (err) {
                          console.log(err);
                        } else {
                          res.json({
                            success: true,
                            message:
                              "บันทึกช้อมูลการเปลี่ยนแปลงสิทธิ์ผู้ใช้งานเสร็จเรียบร้อย!"
                          }); // Return success
                        }
                      });
                    }
                  } else {
                    user.permission = newPermission;
                    // Save changes
                    user.save(function(err) {
                      if (err) {
                        console.log(err);
                      } else {
                        res.json({
                          success: true,
                          message:
                            "บันทึกช้อมูลการเปลี่ยนแปลงสิทธิ์ผู้ใช้งานเสร็จเรียบร้อย!"
                        }); // Return success
                      }
                    });
                  }
                }

                if (newPermission === "admin") {
                  if (mainUser.permission === "admin") {
                    user.permission = newPermission;
                    // Save changes
                    user.save(function(err) {
                      if (err) {
                        console.log(err);
                      } else {
                        res.json({
                          success: true,
                          message:
                            "บันทึกช้อมูลการเปลี่ยนแปลงสิทธิ์ผู้ใช้งานเสร็จเรียบร้อย!"
                        }); // Return success
                      }
                    });
                  } else {
                    res.json({
                      success: false,
                      message:
                        "สิทธิ์การเข้าใช้งานไม่เพียงพอในการเปลี่ยนแปลงสิทธิ์ผู้เข้าใช้งาน คุณต้องเป็นผู้ดูแลระบบถึงจะสามารถกำหนดผู้ใช้งานอื่นเป็นผู้ดูและระบบได้"
                    }); // Return error
                  }
                }
              }
            });
          } else {
            res.json({
              success: false,
              message:
                "สิทธิ์การเข้าใช้งานไม่เพียงพอในการเปลี่ยนแปลงสิทธิ์ผู้เข้าใช้งาน"
            }); // Return error
          }
        }
      }
    });
  });

  return router; // Return router object to server
};

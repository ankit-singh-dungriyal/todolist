const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// Connecting to mongoose database
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser : true, useUnifiedTopology: true});

mongoose.set('useFindAndModify', false);

const itemSchema = new mongoose.Schema({
  name: String
})
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
})

const Item = mongoose.model('Item', itemSchema);
const List = mongoose.model('List', listSchema);

const item1 = new Item({
  name: "Press + to insert item"
})
const item2 = new Item({
  name: "Click on checkbox to delete the item"
})
const item3 = new Item({
  name: "Enjoy adding stuffs in your todolist"
})

const defaultItems = [item1, item2, item3];


app.get("/", function(req, res) {

  const day = date.getDate();
  Item.find({},function(err, foundItems){
    if(foundItems.length === 0){

      // inserting the default items in the database
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        } else{
          console.log("Default items inserted successfully")
        }
      })

      res.redirect("/");
    } else{
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
  })


});

app.post("/", function(req, res){

  const item = req.body.newItem;
  const newItem = new Item({name: item});
  const listName = req.body.list;
  if (listName === date.getDate()) {
    newItem.save(function(err, result){
      if(err){
        console.log(err)
      } else{
        res.redirect("/");
      }
    });
  } else {

    List.findOne({name: listName}, function(err, foundList){
      if(err){
        console.log(err);
      } else{
        foundList.items.push(newItem);
        foundList.save(function(err){
          if(err){
            console.log(err);
          } else{
            res.redirect("/" + listName);
          }
        })
      }
    })

    // We can also use this method
    /*
    List.updateOne({name: req.body.list},{$push: {items : newItem}}, function(err, result){
      if(err){
        console.log("update error : "+ err);
      } else{
        console.log("update result : "+ result);
        res.redirect("/"+ req.body.list);
      }
    })
    */
  }
});

app.post("/delete", function(req, res){
  console.log(req.body.checkbox);
  const listName = req.body.listName;
  const itemToDelete = req.body.checkbox;
  console.log(listName)

  if(listName === date.getDate()){
    Item.findByIdAndDelete({_id: itemToDelete}, function(err){
      if(err){
        console.log(err);
      }
    });
    res.redirect("/");
  } else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: { _id: itemToDelete}}}, function(err, result){
      if(err){
        console.log(err);
      } else{
        console.log("customList updated successfully");
        res.redirect("/" + listName);
      }
    })
  }


})

app.get("/:customList", function(req, res){
  const customListName = _.capitalize(req.params.customList);
  console.log(customListName)

  List.findOne({name: customListName }, function(err, foundList){
    if(!err){
      if(!foundList){
        const newCustomList = new List({
          name: customListName,
          items: defaultItems
        })

        newCustomList.save(function(err, result){
          if(err){
            console.log(err);
          } else{
            res.redirect("/"+ customListName);
          }
        });
      } else{
        console.log("list already exist")
        res.render("list", {listTitle:foundList.name ,newListItems: foundList.items});
      }
    }
  });

});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

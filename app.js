
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const { request } = require("http");
const _=require("lodash"); 
const mongoose =require("mongoose");
const homeStartingContent = "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent = "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent = "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb://0.0.0.0:27017/integrated_pro");


const posts=[];
const postSchema = {
  title: String,
  content: String
};
const Post =  mongoose.model("Post",postSchema);
const items=["Contest","Webd","Clothes"];


const itemSchema={
    name:String
};
const Item=mongoose.model("Item",itemSchema);
const item1=new Item({
    name:"coding"
});
const item2=new Item({
    name:"Webd"
});
const item3=new Item({
    name:"Shadow"
});
const defaultItems=[item1,item2,item3];
const listSchema={
    name:String,
    items:[itemSchema]
}
const List=mongoose.model("List",listSchema);

app.get("/", async function(request, response){
  try {
    const posts = await Post.find({}); 
    response.render("home", {
      startingContent: homeStartingContent,
      posts: posts
    });
  } catch (err) {
    console.error(err);
    response.status(500).send('Internal Server Error');
  }
});

app.get("/about",function(request,response){
  response.render("about",{
    about:aboutContent
  });
});

app.get("/contact",function(request,response){
  response.render("contact",{
    contact:contactContent
  });
});
app.get("/compose",function(request,response){
  response.render("compose");
});


app.get("/posts/:postId", async function(request, response) {
  try {
    const requestedId = request.params.postId;
    const post = await Post.findOne({ _id: requestedId });
    if (!post) {
  
      return response.status(404).send('Post not found');
    }

    response.render("post", {
      title: post.title,
      content: post.content
    });
  } catch (err) {

    console.error(err);
    response.status(500).send('Internal Server Error');
  }
});

app.post("/compose", function(request, response) {
  const post = new Post({
    title: request.body.postTitle,
    content: request.body.postBody
  });

  post.save()
    .then(() => {
      response.redirect("/");
    })
    .catch(err => {
      console.error("Error saving post:", err);
      response.status(500).send('Internal Server Error');
    });
});

app.get("/list",function(request,response){
  
    Item.find({}).then(function(FoundItems){
      var today=new Date();
      var options={
          weekday:"long",
          day:"numeric",
          month:"long"
      };
      var day=today.toLocaleDateString("en-US",options);
        if(FoundItems.length===0){
            Item.insertMany(defaultItems);
            response.redirect("/");
        }else{
        response.render("list", {ListTitle: "Today", newListItem:FoundItems});
        }
      })
       .catch(function(err){
        console.log(err);
      })
});

app.get("/list/:customListName", function(request, response) {
    const customListName = _.capitalize(request.params.customListName);

    List.findOne({ name: customListName })
        .then(function(foundList) {
            if (!foundList) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                return list.save();
            }
            return foundList;
        })
        .then(function(list) {
            response.render("list", { ListTitle: customListName, newListItem: list.items });
        })
        .catch(function(err) {
            console.error(err);
            response.status(500).send('Internal Server Error'); 
        });
});
app.post("/list", async function(request, response) {
    const itemName = request.body.new_item;
    const listName = request.body.list;
    const item = new Item({
        name: itemName
    });

    try {
        if (listName === "Today") {
            await item.save();
            response.redirect("/list");
        } else {
            const foundList = await List.findOne({ name: listName });
            if (foundList) {
                foundList.items.push(item);
                await foundList.save();
                response.redirect("/list/" + listName);
            } else {
                console.error('List not found.');
                response.status(404).send('List not found');
            }
        }
    } catch (error) {
        console.error(error);
        response.status(500).send('Internal Server Error'); 
    }
});

app.post("/delete", async function(request, response) {
    const checkedId = request.body.checked;
    const listName = request.body.listName;

    try {
        if (listName === "Today") {
            const removedItem = await Item.findByIdAndRemove(checkedId);
            if (removedItem) {
                console.log('Item removed successfully:');
            } else {
                console.log('Item not found.');
            }
            response.redirect("/list");
        } else {
            const foundList = await List.findOneAndUpdate(
                { name: listName },
                { $pull: { items: { _id: checkedId } } },
                { new: true }
            );
            if (foundList) {
                response.redirect("/list/" + listName);
            } else {
                console.log('List not found.');
                response.status(404).send('List not found');
            }
        }
    } catch (error) {
        console.error('Error removing item:', error);
        response.status(500).send('Internal Server Error'); 
    }
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});

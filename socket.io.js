const express = require('express');
const cors = require('cors');
const expForm = require('express-formidable');
const {graphqlHTTP} = require('express-graphql');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const {GraphQLObjectType, GraphQLString, GraphQLList, GraphQLID, GraphQLInt, GraphQLSchema} = require('graphql');
const countries = require("./server/getCountries")();
const io = new Server(server);

const database = db()


const CountryType = new GraphQLObjectType({
  name: "Countries",
  fields: ()=>({
    name: {type: GraphQLString},
    flag: {type: GraphQLString},
    code: {type: GraphQLString},
    states: {type: new GraphQLList(GraphQLString)},
  })
})


const AuthorType = new GraphQLObjectType({
  name: "Author",
  fields: ()=>({
    id: {type: GraphQLInt},
    name: {type: GraphQLString},
    books: {
      type: new GraphQLList(BookType),
      resolve(parent,args){
        return database.books.filter(book=>{
          return parent.id == book.authorID
          });
      }
    }
  })
})

const BookType = new GraphQLObjectType({
  name: "Book",
  fields: ()=>({
    id: {type: GraphQLInt},
    title: {type: GraphQLString},
    year: {type: GraphQLInt},
    author: {
      type: AuthorType,
      args: {id: {type: GraphQLID}},
      resolve(parent, args){
        return database.authors.find(author=>{
          return parent.authorID == author.id
        })
      }
    }
  })
});


const RootQuery = new GraphQLObjectType({
  name: "RootQuery",
  fields: ({
    book:{
      type: BookType,
      args: {
        id: {type: GraphQLID}
      },
      resolve(parent,args){
        return database.books.find(book=>{
          return book.id == args.id
        })
      }
    },
    author: {
      type: AuthorType,
      args: {
        id: {type: GraphQLID}
      },
      resolve(parent,args){
        return database.authors.find(author=>{
          return args.id == author.id
        })
      }
    },
    countries: {
      type: new GraphQLList(CountryType),
      args: {
        startsWith: {
          type: GraphQLString
        }, 
        limit: {
          type: GraphQLID
        }
      },
      resolve(parent,args){
        return countries.filter(country=>{
          return (args.startsWith==="*")? true : country.name.toLowerCase().startsWith(args.startsWith.toLowerCase())
        }).slice(0, args.limit-0)
      }
    },
  })
})


app.use("/graphiql", graphqlHTTP({
  schema:  new GraphQLSchema({
    query: RootQuery
  }),
  graphiql: true
}))


app.use(cors())

app.get('/', (req, res) => {
  res.sendFile('/sdcard/tailwind/tailwind.html');
});

app.get('/output', (req, res) => {
  res.sendFile('/sdcard/tailwind/output.css');
});

io.on('connection', (socket) => {
  console.log("Socket.io connected");
  socket.emit("server", "emitted from server: "+socket.id)
  socket.on("client", msg=>{
    console.log(msg)
  })
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log('listening on port: '+PORT);
});


// =============== Database ========
function db(){
const _database = {
  books: [
  {
    id: 1,
    title: "Things Fall Apart",
    year: 2004, 
    authorID: 1
  },
  {
    id: 2,
    title: "Arrows Of God",
    year: 2006, 
    authorID: 1
  },
  {
    id: 3,
    title: "Eze Goes To School",
    year: 2001, 
    authorID: 2
  },
  {
    id: 4,
    title: "Romeo And Juliet",
    year: 1994, 
    authorID: 3
  },
  {
    id: 3,
    title: "The Hostile Shores",
    year: 1998, 
    authorID: 4
  }
],
authors: [
  {
    id: 1,
    name: "Chinua Achebe"
  },
  {
    id: 2,
    name: "John Okafor"
  },
  {
    id: 3,
    name: "Michael Smith"
  },
  {
    id: 4,
    name: "William Shakespare"
  }
]
}
return _database
}
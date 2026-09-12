const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const uploadDir = path.join(__dirname, "uploads");
const dataFile = path.join(__dirname, "wallpapers.json");
fs.mkdirSync(uploadDir, {recursive:true});
if(!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, "[]");

const storage = multer.diskStorage({
  destination: (_,__,cb)=>cb(null, uploadDir),
  filename: (_,file,cb)=>{
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi,"-").slice(0,60);
    cb(null, Date.now()+"-"+safe+ext);
  }
});
const upload = multer({
  storage,
  limits:{fileSize: 10*1024*1024},
  fileFilter: (_,file,cb)=>{
    cb(null, /^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype));
  }
});

app.use(express.json());
app.use(express.static(__dirname));
app.use("/uploads", express.static(uploadDir));

app.get("/api/wallpapers", (_,res)=>{
  res.json(JSON.parse(fs.readFileSync(dataFile,"utf8")));
});

app.post("/api/upload", upload.single("wallpaper"), (req,res)=>{
  if(!req.file) return res.status(400).json({error:"Please select a JPG, PNG, WEBP or GIF image."});
  const list = JSON.parse(fs.readFileSync(dataFile,"utf8"));
  const item = {
    id: Date.now().toString(),
    title: req.body.title?.trim() || path.parse(req.file.originalname).name,
    category: req.body.category || "Other",
    file: "/uploads/"+req.file.filename
  };
  list.unshift(item);
  fs.writeFileSync(dataFile, JSON.stringify(list,null,2));
  res.json(item);
});

app.listen(PORT, "0.0.0.0", ()=>console.log(`Wallora running on port ${PORT}`));

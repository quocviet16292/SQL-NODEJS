const express = require("express");
const app = express();
const port = 1433;

app.set("view engine","ejs");
app.use(express.static("public"));
app.listen(port,()=>console.log(`Server: http://localhost:${port}`));

const mssql = require("mssql");
const config = {
    server:'LAPTOP-QAOLFL7H\\SQLEXPRESS',
    database:'Lap4',
    user:'sa',
    password:'123456',
    options: {
        encrypt: false
    }
};
mssql.connect(config,(err)=>{
    if(err) console.log(err);
    else console.log("connect db thành công");
});
var db = new mssql.Request();
app.get("/",(req,res)=>{
    db.query("SELECT * FROM KhachHang",(err,rows)=>{
        if(err) res.send('truy vấn không thành công');
        else res.render("home",{
            khs: rows.recordset
        });
    })
})

app.get("/them-khach-hang",(req,res)=>res.render("form"));


const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended:true}))

app.post("/luu-khach-hang",(req,res)=>{
    let ten = req.body.TenKhachHang;
    let dt = req.body.SoDienThoai;
    let add = req.body.DiaChi;
    let sql_text = "INSERT INTO KhachHang(TenKhachHang,DiaChi,SoDienThoai) VALUES (N'"+ten+"',N'"+add+"',N'"+dt+"')";
    db.query(sql_text, (err,rows)=>{
        if(err) res.send(err);
        else res.redirect("/");
    })
})

app.get("/san-pham",(req,res)=>{
    db.query("SELECT * FROM SanPham", (err,rows)=>{
        if(err) res.send("Truy vấn sản phẩm không thành công");
        else res.render("sanpham",{
            sps: rows.recordset
        })
    })
})
app.get("/search",(req,res)=>{
    let key_search = req.query.keyword;
    db.query("SELECT * FROM SanPham WHERE TenSanPham LIKE N'%"+key_search+"%'",(err,rows)=>{
        if(err) res.send(err);
        else res.render("sanpham",{
            sps:rows.recordset
        });
    });
})
app.get("/them-san-pham",(req,res)=>res.render("addproduct"));
app.post("/luu-san-pham",(req,res)=>{
    let tensp = req.body.TenSanPham;
    let mota = req.body.MieuTa;
    let gia = req.body.DonGia;
    let donvi = req.body.DonVi;
    let sql_text = "INSERT INTO SanPham(TenSanPham,MieuTa,DonGia,DonVi) VALUES (N'"+tensp+"',N'"+mota+"',"+gia+",N'"+donvi+"')";
    db.query(sql_text, (err,rows)=>{
        if(err) res.send(err);
        else res.redirect("/san-pham");
    })
})


app.get("/tao-don-hang", (req,res)=>{
    let sql_text = "SELECT * FROM KhachHang; SELECT * FROM SanPham";
    db.query(sql_text, (err,rows)=>{
        if(err) res.send(err);
        else {
            res.render("donhang", {
                khs: rows.recordsets[0],
                sps: rows.recordsets[1]
            })
        }
    })
})
app.post("/luu-don-hang",function (req,res) {
    let khID = req.body.MaKhachHang;
    let spID = req.body.ID;
    let sql_text = "SELECT * FROM SanPham WHERE ID IN ("+spID+");";
    db.query(sql_text,function (err,rows) {
        if(err) res.send(err);
        else{
            let sps = rows.recordset;
            let tongtien = 0;
            sps.map(function (e) {
                tongtien += e.DonGia;
            });
            let sql_text2 = "INSERT INTO DonHang(MaKhachHang,GiaTriDonHang,NgayDonHang) VALUES("+khID+","+tongtien+",GETDATE());SELECT SCOPE_IDENTITY() AS DonHangID;";
            db.query(sql_text2,function (err,rows) {
                let donhang = rows.recordset[0];
                let MaSo = donhang.DonHangID;
                let sql_text3 = "";
                sps.map(function (e) {
                    sql_text3 += "INSERT INTO DonHang_SanPham(MaDonHang,ID,SoLuong,ThanhTien) VALUES("+MaSo+","+e.ID+",1,"+(e.DonGia*1)+");";
                })
                db.query(sql_text3,function (err,rows) {
                    if(err) res.send(err);
                    else res.redirect("/san-pham");
                })
            })
        }
    });
    // res.send(khID);
    // res.send(spID);
    // res.send(sql_text);
})
//API, lay du lieu tu DB, connect phai dùng async nếu ko sẽ có độ trễ dẫn đến không chạy đúng async-->await
app.get("/chi-tiet-khach-hang/:id", async (req,res)=>{
    let khid = req.params.id;
    let sql_text = "SELECT * FROM KhachHang WHERE MaKhachHang = " +khid;
    let kh = null;
    await db.query(sql_text).then(rs=> kh = rs).catch(err=>console.log(err));
    let sql_text2 = "SELECT * FROM DonHang WHERE MaKhachHang = " + khid;
    let donhang = [];
    await db.query(sql_text2).then(rs=> donhang = rs).catch(err=>console.log(err));
    await res.render("khachhang",{
        khachhang: kh.recordset[0],
        donhang: donhang.recordset
    });
})
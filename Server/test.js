const fileName = "DE_9.12.2024_PO_Bearbub";

// Sử dụng biểu thức chính quy để trích xuất ngày, tháng, năm
const dateRegex = /_(\d+)\.(\d+)\.(\d+)_/;
const match = fileName.match(dateRegex);

if (match) {
    const day = match[1].padStart(2, '0'); // Đảm bảo định dạng ngày luôn có 2 chữ số
    const month = match[2].padStart(2, '0'); // Đảm bảo định dạng tháng luôn có 2 chữ số
    const year = match[3];

    console.log(`Ngày: ${day}`);
    console.log(`Tháng: ${month}`);
    console.log(`Năm: ${year}`);

    // Nếu cần, bạn có thể xuất ngày tháng năm dưới dạng chuỗi
    const formattedDate = `${day}/${month}/${year}`;
    console.log(`Ngày định dạng: ${formattedDate}`);
} else {
    console.log("Không tìm thấy ngày tháng trong tên file.");
}

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';


const ViewProcess = () => {
    const [data, setData] = useState([]); // Dữ liệu sau khi lọc và cộng gộp
    const [jsonData, setJsonData] = useState({}); // JSON kết quả

    // Hàm xử lý upload file và đọc dữ liệu từ file Excel
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return; // Không có file được chọn thì thoát

        const reader = new FileReader();
        reader.onload = (evt) => {
            const binaryStr = evt.target.result;
            const workbook = XLSX.read(binaryStr, { type: 'binary' });

            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonDataRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const headerRow = jsonDataRaw[0];
            const productLinkIndex = headerRow.indexOf('Product Link');
            const revIndex = headerRow.indexOf('Rev');
            const storeIndex = headerRow.indexOf('store');

            if (productLinkIndex === -1 || revIndex === -1 || storeIndex === -1) {
                alert('Không tìm thấy các cột: Product Link, Rev, store trong file Excel.');
                return;
            }

            // Chỉ lấy dữ liệu cần thiết và cộng gộp nếu Product Link và store trùng nhau
            const groupedData = {};
            jsonDataRaw.slice(1).forEach((row) => {
                const productLink = row[productLinkIndex];
                const rev = parseFloat(row[revIndex]) || 0;
                const store = row[storeIndex];

                if (productLink && store) {
                    const key = `${store}-${productLink}`;
                    if (!groupedData[key]) {
                        groupedData[key] = {
                            productLink,
                            store,
                            rev,
                        };
                    } else {
                        groupedData[key].rev += rev; // Cộng giá trị Rev nếu trùng
                    }
                }
            });

            setData(Object.values(groupedData)); // Biến đổi object thành array và lưu vào state
            setJsonData(groupedData); // Lưu JSON gốc nếu cần xuất
        };

        reader.readAsBinaryString(file); // Đọc dữ liệu từ file Excel
    };

    // Xuất dữ liệu JSON
    const handleExportJSON = async () => {
        console.log(jsonData)
        for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                const store = jsonData[key].store;
                const link = jsonData[key].productLink;


                try {
                    const response = await axios.get('http://localhost:8000/links-sort', {
                        params: { link, store }
                    });
                    console.log('test', response.data.data[0]);
                    console.log('---------------------------');

                    const rev = Number(jsonData[key].rev); // Chuyển đổi rev sang số
                    const cost = Number(response.data.data[0].cost); // Chuyển đổi cost sang số
                    const idSeller = response.data.data[0].idseller;
                    const product_name = response.data.data[0].product;

                    const profit = (rev / 100) * cost; // Tính lợi nhuận
                    const exchangeRate = 25400; // Tỷ giá
                    const total_amount = profit * exchangeRate; // Tính thành tiền

                    console.log("Revenue (rev):", rev);
                    console.log("Cost:", cost);
                    console.log("Profit:", profit);
                    console.log("Total Amount (VND):", total_amount);



                    const today = new Date();




                    await axios.post('http://localhost:8000/add-profit', {
                        transaction_date: today,
                        idSeller: idSeller,
                        store: store,
                        product_name: product_name,
                        profit_on_store: rev,
                        cost: cost,
                        profit: profit,
                        exchange_rate: exchangeRate,
                        total_amount: total_amount,
                        link: link
                    });




                } catch (error) {
                    console.error(`Error calling API for store: ${store}`, error);
                }

            }
        }


        // const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        // const url = URL.createObjectURL(blob);

        // const a = document.createElement('a');
        // a.href = url;
        // a.download = 'data.json';
        // a.click();
        // URL.revokeObjectURL(url);
    };

    return (
        <div className="container">
            {/* Header */}
            <header>
                <h1>Đọc và Gộp Dữ Liệu từ File Excel</h1>
            </header>

            {/* Phần Upload */}
            <div className="upload-section">
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                />
                <button onClick={handleExportJSON} className="export-btn">Xuất JSON</button>
            </div>

            {/* Hiển thị dữ liệu */}
            <div className="table-section">
                {data.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>Product Link</th>
                                <th>store</th>
                                <th>Tổng Rev</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={index}>
                                    <td>{row.productLink}</td>
                                    <td>{row.store}</td>
                                    <td>{row.rev}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>Vui lòng tải lên file Excel để xem dữ liệu.</p>
                )}
            </div>
        </div>
    );
};

export default ViewProcess;

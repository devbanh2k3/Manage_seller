import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';

const ViewProcess = () => {
    const [data, setData] = useState([]);
    const [jsonData, setJsonData] = useState({});
    const [modalData, setModalData] = useState([]); // Dữ liệu trong modal là mảng
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fileDate, setFileDate] = useState(null); // Lưu giá trị ngày từ tên file
    const [missingLinks, setMissingLinks] = useState([]);
    const [isMissingLinksModalOpen, setIsMissingLinksModalOpen] = useState(false);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Lấy tên file
        const fileName = file.name; // Ví dụ: 9-12-2024.xlsx
        const dateMatch = fileName.match(/(\d{1,2})-(\d{1,2})-(\d{4})/); // Tìm ngày dạng D-M-YYYY

        let fileDate = null;

        if (dateMatch) {
            const day = parseInt(dateMatch[1], 10); // Lấy ngày
            const month = parseInt(dateMatch[2], 10) - 1; // Lấy tháng (trừ 1 vì tháng bắt đầu từ 0)
            const year = parseInt(dateMatch[3], 10); // Lấy năm

            fileDate = new Date(year, month, day); // Tạo đối tượng Date
            setFileDate(fileDate); // Lưu ngày vào state
        } else {
            alert('Tên tệp không chứa ngày hợp lệ (D-M-YYYY).');
            return;
        }

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

            const groupedData = {};
            jsonDataRaw.slice(1).forEach((row) => {
                const productLink = row[productLinkIndex];
                const rev = parseFloat(row[revIndex]) || 0;
                const store = row[storeIndex];

                if (productLink && store) {
                    const key = `${store}-${productLink}`;
                    if (!groupedData[key]) {
                        groupedData[key] = { productLink, store, rev };
                    } else {
                        groupedData[key].rev += rev;
                    }
                }
            });

            setData(Object.values(groupedData));
            setJsonData(groupedData);
        };

        reader.readAsBinaryString(file);
    };
    const formatDateForMySQL = (date) => {
        if (!date) return null;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const handleExportJSON = async () => {
        const missingLinks = [];
        const modalTableData = [];

        for (const key in jsonData) {
            if (jsonData.hasOwnProperty(key)) {
                const store = jsonData[key].store;
                const link = jsonData[key].productLink;

                try {
                    const response = await axios.get('http://localhost:8000/links/sort', {
                        params: { link, store },
                    });



                    if (response.data.message === 'No links found') {
                        missingLinks.push({ link, store });
                        let message = 'Không tìm thấy link';
                    } else {
                        const rev = Number(jsonData[key].rev);
                        const cost = Number(response.data.data[0].productDetails.cost);
                        const idSeller = response.data.data[0].idseller;
                        const product_name = response.data.data[0].productDetails.name;

                        const profit = (rev / 100) * cost;
                        const exchangeRate = 25400;
                        const total_amount = Math.round(profit * exchangeRate * 100) / 100;

                        const transaction_date = formatDateForMySQL(fileDate);

                        modalTableData.push({
                            transaction_date: transaction_date,
                            idSeller,
                            store,
                            product_name,
                            profit_on_store: rev,
                            cost,
                            profit,
                            exchange_rate: exchangeRate,
                            total_amount,
                            link

                        });
                    }
                } catch (error) {
                    let errorMessage = 'Lỗi kết nối đến API';

                    if (error.response && error.response.status === 500) {
                        errorMessage = 'Trùng lặp'; // Thông báo trạng thái trùng lặp
                    }

                    modalTableData.push({
                        transaction_date: formatDateForMySQL(fileDate),
                        idSeller: null,
                        store,
                        product_name: null,
                        profit_on_store: jsonData[key].rev,
                        cost: null,
                        profit: null,
                        exchange_rate: null,
                        total_amount: null,
                        link

                    });
                }
            }
        }

        if (modalTableData.length > 0) {
            setModalData(modalTableData);
            setIsModalOpen(true);
        }

        if (missingLinks.length > 0) {
            setMissingLinks(missingLinks);
            setIsMissingLinksModalOpen(true);
        }
    };


    const handleConfirmSubmit = async () => {
        try {
            const updatedModalData = [...modalData]; // Sao chép dữ liệu hiện tại

            for (let i = 0; i < modalData.length; i++) {
                const row = modalData[i];
                try {
                    const response = await axios.post('http://localhost:8000/links/add-profit', row);

                    // Nếu thành công, cập nhật trạng thái
                    updatedModalData[i].status = 'Thành công';
                } catch (error) {
                    // Nếu lỗi (bao gồm lỗi 500), cập nhật trạng thái phù hợp
                    if (error.response && error.response.status === 500) {
                        updatedModalData[i].status = 'Trùng lặp';
                    } else {
                        updatedModalData[i].status = 'Lỗi không xác định';
                    }
                }
            }

            // Cập nhật lại dữ liệu modal với trạng thái mới
            setModalData(updatedModalData);

            alert('Cập nhật trạng thái thành công!');
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error);
            alert('Có lỗi xảy ra trong quá trình xác nhận.');
        }
    };
    const PriceDisplay = ({ totalAmount }) => {
        const formatVND = (amount) => {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        };

        return (
            <td>{formatVND(totalAmount)}</td>
        );
    };

    return (
        <div className="container">
            <header>
                <h1>Đọc và Gộp Dữ Liệu từ File Excel</h1>
            </header>

            <div className="upload-section">
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                />
                <button onClick={handleExportJSON} className="export-btn">Kiếm tra</button>
            </div>

            <div className="table-section">
                {data.length > 0 ? (
                    <table>
                        <thead>
                            <tr>
                                <th>STT</th> {/* Cột số thứ tự */}
                                <th>Product Link</th>
                                <th>Store</th>
                                <th>Tổng Rev</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td> {/* Hiển thị số thứ tự */}
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
            {isMissingLinksModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Các link chưa được thêm</h2>
                        {missingLinks.length > 0 ? (
                            <table>
                                <thead>
                                    <tr>
                                        <th>STT</th> {/* Cột số thứ tự */}
                                        <th>Store</th>
                                        <th>Link</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {missingLinks.map((item, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td> {/* Hiển thị số thứ tự */}
                                            <td>{item.store}</td>
                                            <td>{item.link}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>Không có link nào chưa được thêm.</p>
                        )}
                        <button onClick={() => setIsMissingLinksModalOpen(false)}>Đóng</button>
                    </div>
                </div>
            )}



            {/* Modal hiển thị dữ liệu */}
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Xác nhận thông tin</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Ngày giao dịch</th>
                                    <th>ID Người Bán</th>
                                    <th>Store</th>
                                    <th>Tên Sản Phẩm</th>
                                    <th>Profit on Store</th>
                                    <th>Cost</th>
                                    <th>Lợi nhuận</th>
                                    <th>Tỷ giá</th>
                                    <th>Tổng số tiền (VND)</th>
                                    <th>Link</th>
                                    <th>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {modalData.map((row, index) => (
                                    <tr key={index}>
                                        <td>{row.transaction_date}</td>
                                        <td>{row.idSeller}</td>
                                        <td>{row.store}</td>
                                        <td>{row.product_name}</td>
                                        <td>{row.profit_on_store}</td>
                                        <td>{row.cost}</td>
                                        <td>{row.profit}</td>
                                        <td>{row.exchange_rate}</td>
                                        <td>{row.total_amount}</td>
                                        <td>{row.link}</td>
                                        <td>{row.status || 'Chưa xử lý'}</td> {/* Hiển thị trạng thái */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={handleConfirmSubmit}>Xác nhận</button>
                        <button onClick={() => setIsModalOpen(false)}>Hủy</button>
                    </div>
                </div>
            )}


        </div>
    );
};

export default ViewProcess;

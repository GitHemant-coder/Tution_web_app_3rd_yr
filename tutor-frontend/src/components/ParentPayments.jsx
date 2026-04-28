import React, { useState, useEffect } from 'react';
import { get, post } from '../api/api';
import { CreditCard, CheckCircle, Clock, Plus, Receipt } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ParentPayments() {
    const [payments, setPayments] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [formData, setFormData] = useState({ student: '', amount: '' });

    useEffect(() => {
        fetchPayments();
        fetchStudents();
    }, []);

    const fetchPayments = async () => {
        try {
            const data = await get('/payments/my-payments', true);
            setPayments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const data = await get('/users/my-children', true);
            setStudents(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddPayment = async (e) => {
        e.preventDefault();
        const now = new Date();
        const timingStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' +
            now.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });

        try {
            await post('/payments', { ...formData, timing: timingStr }, true);
            toast.success(`Payment initiated at ${timingStr}! Admin will verify it soon.`);
            setShowAdd(false);
            setFormData({ student: '', amount: '' });
            fetchPayments();
        } catch (err) {
            toast.error("Failed to initiate payment");
        }
    };

    const downloadReceipt = (payment) => {
        const content = `
            RECEIPT
            ---------------------------
            Payment ID: ${payment._id}
            Student: ${payment.student?.name}
            Timing: ${payment.timing}
            Amount: ₹${payment.amount}
            Status: ${payment.status}
            Date Paid: ${payment.datePaid ? new Date(payment.datePaid).toLocaleDateString() : 'N/A'}
            ---------------------------
            Thank you for your payment!
        `;
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `receipt_${payment._id}.txt`;
        document.body.appendChild(element);
        element.click();
    };

    if (loading) return <div>Loading payments...</div>;

    return (
        <div className="page-enter-active">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CreditCard size={24} className="text-secondary" /> Fee Payments
                </h3>
                <button className="btn btn-modern btn-gradient" onClick={() => setShowAdd(!showAdd)}>
                    <Plus size={18} /> {showAdd ? 'Cancel' : 'Make Payment'}
                </button>
            </div>

            {showAdd && (
                <div className="card card-modern fade-in" style={{ marginBottom: '30px', border: '1px solid var(--secondary)' }}>
                    <h4 style={{ marginBottom: '20px' }}>New Payment Entry</h4>
                    <form onSubmit={handleAddPayment} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                        <div>
                            <label className="small">Select Child (Student)</label>
                            <select
                                className="input-modern"
                                required
                                value={formData.student}
                                onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                            >
                                <option value="">Select Child</option>
                                {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="small">Amount (₹)</label>
                            <input
                                type="number"
                                className="input-modern"
                                placeholder="Enter amount"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="btn btn-modern btn-gradient" style={{ height: '45px' }}>Pay Now</button>
                    </form>
                </div>
            )}

            <div className="card card-modern slide-in-bottom delay-100" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                        <tr>
                            <th style={{ padding: '20px', textAlign: 'left' }}>Student Name</th>
                            <th style={{ padding: '20px', textAlign: 'left' }}>Payment Timing</th>
                            <th style={{ padding: '20px', textAlign: 'left' }}>Amount</th>
                            <th style={{ padding: '20px', textAlign: 'left' }}>Status</th>
                            <th style={{ padding: '20px', textAlign: 'left' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No payment records found.</td></tr>
                        ) : (
                            payments.map(p => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '20px' }}>{p.student?.name}</td>
                                    <td style={{ padding: '20px', fontSize: '0.85rem' }}>{p.timing}</td>
                                    <td style={{ padding: '20px' }}>₹{p.amount}</td>
                                    <td style={{ padding: '20px' }}>
                                        <span style={{
                                            color: p.status === 'paid' ? '#10b981' : '#f59e0b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontWeight: '600'
                                        }}>
                                            {p.status === 'paid' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                            {p.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px' }}>
                                        {p.status === 'paid' && (
                                            <button
                                                onClick={() => downloadReceipt(p)}
                                                className="btn btn-modern btn-outline-modern"
                                                style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '0.8rem' }}
                                            >
                                                <Receipt size={14} /> Receipt
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

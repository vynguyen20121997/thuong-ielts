import type { Metadata } from 'next';
import Diagnostic from '../../../features/diagnostic/ui/Diagnostic';
export const metadata:Metadata={title:"Kiểm tra nền tảng IELTS | Thương Hồ's Class",description:'Bài kiểm tra 45 phút với Listening, Reading và Grammar. Nhận nhận xét chi tiết và kế hoạch tự học bốn tuần.'};
export default function Page(){return <Diagnostic/>;}

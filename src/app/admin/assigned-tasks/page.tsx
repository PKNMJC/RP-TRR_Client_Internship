'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Edit2,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Wrench,
  MessageSquare,
  MapPin,
  ChevronRight,
  Download,
  RefreshCw,
  X,
} from 'lucide-react';
import { apiFetch } from '@/services/api';

interface AssignedTask {
  id: number;
  ticketCode: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  equipmentName: string;
  location: string;
  assigneeId: number;
  assignee?: {
    id: number;
    name: string;
    email: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

interface TaskStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
}

const statusLabels = {
  OPEN: { label: 'เปิด', color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-50', icon: AlertCircle },
  IN_PROGRESS: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-50', icon: Clock },
  DONE: { label: 'เสร็จสิ้น', color: 'bg-green-100 text-green-800', bgColor: 'bg-green-50', icon: CheckCircle },
};

const priorityLabels = {
  LOW: { label: 'ต่ำ', color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-50' },
  MEDIUM: { label: 'ปานกลาง', color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-50' },
  HIGH: { label: 'สูง', color: 'bg-red-100 text-red-800', bgColor: 'bg-red-50' },
};

export default function AssignedTasksPage() {
  const [tasks, setTasks] = useState<AssignedTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<AssignedTask[]>([]);
  const [stats, setStats] = useState<TaskStats>({ total: 0, open: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTask, setSelectedTask] = useState<AssignedTask | null>(null);
  const itemsPerPage = 8;

  // Fetch assigned tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch('/api/tickets');
        
        // Filter tasks that have an assignee (assigned to someone)
        const assignedTasks = (data || []).filter((task: AssignedTask) => task.assigneeId);
        
        setTasks(assignedTasks);
        setFilteredTasks(assignedTasks);

        // Calculate stats
        setStats({
          total: assignedTasks.length,
          open: assignedTasks.filter((t: AssignedTask) => t.status === 'OPEN').length,
          inProgress: assignedTasks.filter((t: AssignedTask) => t.status === 'IN_PROGRESS').length,
          completed: assignedTasks.filter((t: AssignedTask) => t.status === 'DONE').length,
        });
      } catch (err: Error | unknown) {
        console.error('Error fetching tasks:', err);
        const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถดึงข้อมูลงานได้';
        setError(errorMessage);
        setTasks([]);
        setFilteredTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = tasks;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((item) => item.status === filterStatus);
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter((item) => item.priority === filterPriority);
    }

    // Search
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.ticketCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.assignee?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'newest') {
      filtered.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === 'oldest') {
      filtered.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else if (sortBy === 'priority') {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      filtered.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]);
    }

    setFilteredTasks(filtered);
    setCurrentPage(1);
  }, [tasks, filterStatus, filterPriority, searchTerm, sortBy]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    const config = statusLabels[status as keyof typeof statusLabels];
    if (!config) return null;
    const Icon = config.icon;
    return Icon;
  };

  // Update task status
  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await apiFetch(`/api/tickets/${taskId}`, 'PUT', { status: newStatus });
      const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus as 'OPEN' | 'IN_PROGRESS' | 'DONE' } : t);
      setTasks(updatedTasks);
      if (selectedTask?.id === taskId) {
        setSelectedTask({ ...selectedTask, status: newStatus as 'OPEN' | 'IN_PROGRESS' | 'DONE' });
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin inline-block">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
          <p className="text-gray-600 mt-4">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">เกิดข้อผิดพลาด</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">งานที่มอบหมาย</h1>
          <p className="text-gray-600 mt-2">
            จัดการงานซ่อมที่ได้รับมอบหมายให้คุณ
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={20} />
          <span>รีโหลด</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">งานทั้งหมด</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</p>
            </div>
            <Wrench size={32} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">รอดำเนินการ</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.open}</p>
            </div>
            <AlertCircle size={32} className="text-yellow-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">กำลังดำเนินการ</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.inProgress}</p>
            </div>
            <Clock size={32} className="text-blue-200" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">เสร็จสิ้น</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.completed}</p>
            </div>
            <CheckCircle size={32} className="text-green-200" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter size={20} />
          ตัวกรองและค้นหา
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="ค้นหารหัส ชื่อ อุปกรณ์ หรือผู้รับผิดชอบ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="OPEN">เปิด</option>
            <option value="IN_PROGRESS">กำลังดำเนินการ</option>
            <option value="DONE">เสร็จสิ้น</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="all">ความสำคัญทั้งหมด</option>
            <option value="LOW">ต่ำ</option>
            <option value="MEDIUM">ปานกลาง</option>
            <option value="HIGH">สูง</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 font-medium">จัดเรียงตาม:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="newest">ล่าสุด</option>
              <option value="oldest">เก่าสุด</option>
              <option value="priority">ความสำคัญสูง</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Grid & List View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {filteredTasks.length > 0 ? (
            <>
              {filteredTasks
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((task) => {
                  const statusConfig = statusLabels[task.status as keyof typeof statusLabels];
                  const priorityConfig = priorityLabels[task.priority as keyof typeof priorityLabels];
                  const StatusIcon = getStatusIcon(task.status);

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className={`p-6 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-lg ${
                        selectedTask?.id === task.id
                          ? `border-blue-500 bg-blue-50 shadow-lg`
                          : `border-gray-300 bg-white shadow-md hover:border-blue-300`
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                              {task.ticketCode}
                            </span>
                            {task.priority === 'HIGH' && (
                              <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                                ด่วน
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        </div>
                        <ChevronRight
                          size={24}
                          className={`text-gray-400 transition-transform ${
                            selectedTask?.id === task.id ? 'rotate-90' : ''
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Wrench size={16} className="text-gray-400" />
                          <span>{task.equipmentName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin size={16} className="text-gray-400" />
                          <span>{task.location || 'ไม่ระบุ'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User size={16} className="text-gray-400" />
                          <span>{task.assignee?.name || 'ไม่มีผู้รับผิดชอบ'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar size={16} className="text-gray-400" />
                          <span>{new Date(task.createdAt).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusConfig?.color}`}>
                            {StatusIcon && <StatusIcon size={14} className="mr-1" />}
                            {statusConfig?.label}
                          </span>
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${priorityConfig?.color}`}>
                            {priorityConfig?.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Pagination */}
              <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-md">
                <p className="text-sm text-gray-600 font-medium">
                  แสดง <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> ถึง{' '}
                  <span className="font-semibold">
                    {Math.min(currentPage * itemsPerPage, filteredTasks.length)}
                  </span>{' '}
                  จากทั้งหมด <span className="font-semibold">{filteredTasks.length}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    ←
                  </button>
                  <span className="px-3 py-1 text-sm font-medium">
                    {currentPage} / {Math.ceil(filteredTasks.length / itemsPerPage)}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage(prev =>
                        Math.min(Math.ceil(filteredTasks.length / itemsPerPage), prev + 1)
                      )
                    }
                    disabled={currentPage === Math.ceil(filteredTasks.length / itemsPerPage)}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    →
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg p-12 text-center shadow-md">
              <Wrench size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg font-medium">ไม่พบงาน</p>
              <p className="text-gray-400 text-sm mt-2">ลองปรับปรุงตัวกรองหรือค้นหาอีกครั้ง</p>
            </div>
          )}
        </div>

        {/* Task Details Sidebar */}
        {selectedTask ? (
          <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">รายละเอียดงาน</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  สถานะงาน
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {['OPEN', 'IN_PROGRESS', 'DONE'].map((status) => {
                    const config = statusLabels[status as keyof typeof statusLabels];
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedTask.id, status)}
                        className={`p-3 rounded-lg text-left font-medium transition-all ${
                          selectedTask.status === status
                            ? `${config.color} ring-2 ring-offset-2 ring-${status === 'DONE' ? 'green' : status === 'IN_PROGRESS' ? 'blue' : 'yellow'}-600`
                            : `bg-gray-100 text-gray-700 hover:bg-gray-200`
                        }`}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Equipment Info */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  อุปกรณ์
                </label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                  <Wrench size={16} className="text-gray-400" />
                  {selectedTask.equipmentName}
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  สถานที่
                </label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  {selectedTask.location || 'ไม่ระบุ'}
                </p>
              </div>

              {/* Requester */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  ผู้แจ้ง
                </label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  {selectedTask.user?.name || 'ไม่ระบุ'}
                </p>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  ผู้รับผิดชอบ
                </label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  {selectedTask.assignee?.name || 'ไม่มีผู้รับผิดชอบ'}
                </p>
              </div>

              {/* Created Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  วันที่สร้าง
                </label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  {new Date(selectedTask.createdAt).toLocaleDateString('th-TH', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  ความสำคัญ
                </label>
                <p className={`inline-flex px-4 py-2 rounded-lg text-sm font-semibold ${priorityLabels[selectedTask.priority as keyof typeof priorityLabels]?.color}`}>
                  {priorityLabels[selectedTask.priority as keyof typeof priorityLabels]?.label}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  คำอธิบายรายละเอียด
                </label>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 max-h-32 overflow-y-auto border border-gray-200">
                  {selectedTask.description}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  <Edit2 size={18} />
                  แก้ไขงาน
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                  <MessageSquare size={18} />
                  เพิ่มความเห็น
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  <Download size={18} />
                  ดาวน์โหลดไฟล์
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-6 text-center text-gray-500">
            <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="font-medium">เลือกงานเพื่อดูรายละเอียด</p>
          </div>
        )}
      </div>
    </div>
  );
}

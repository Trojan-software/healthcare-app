import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/lib/i18n';
import { 
  Users, 
  Search, 
  Filter, 
  Plus,
  User,
  Phone,
  Mail,
  Hospital,
  Calendar,
  Activity,
  CheckCircle,
  XCircle
} from 'lucide-react';
import MissedReadingsReport from './MissedReadingsReport';

interface Patient {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  patientId: string;
  hospitalId: string;
  isActive: boolean;
  createdAt: string;
  lastActivity: string;
  dateOfBirth?: string;
}

interface Hospital {
  id: string;
  name: string;
  location: string;
  type: string;
}

export default function BilingualPatientManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'dob' | 'patientId'>('name');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMissedReadingsReport, setShowMissedReadingsReport] = useState(false);

  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch patients data
  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['/api/patients'],
    retry: false
  });

  const allPatients: Patient[] = Array.isArray(patientsData) ? patientsData : [];

  // Hospitals list with Arabic names and "Others" option
  const hospitals: Hospital[] = [
    { id: "SEHA", name: isRTL ? "مدينة الشيخ خليفة الطبية" : "Sheikh Khalifa Medical City", location: "Abu Dhabi", type: "Government Hospital" },
    { id: "MAFRAQ", name: isRTL ? "مستشفى المفرق" : "Mafraq Hospital", location: "Abu Dhabi", type: "Government Hospital" },
    { id: "ALZAHRA", name: isRTL ? "مستشفى الزهراء" : "Al Zahra Hospital", location: "Sharjah", type: "Private Hospital" },
    { id: "CORNICHE", name: isRTL ? "مستشفى الكورنيش" : "Corniche Hospital", location: "Abu Dhabi", type: "Government Hospital" },
    { id: "CLEVELANAD", name: isRTL ? "كليفلاند كلينك أبوظبي" : "Cleveland Clinic Abu Dhabi", location: "Abu Dhabi", type: "Private Hospital" },
    { id: "OTHERS", name: isRTL ? "أخرى" : "Others", location: "Custom", type: "Custom Hospital" },
    { id: "BURJEEL", name: isRTL ? "مستشفى برجيل" : "Burjeel Hospital", location: "Abu Dhabi", type: "Private Hospital" },
    { id: "NMC", name: isRTL ? "مستشفى NMC الملكي" : "NMC Royal Hospital", location: "Abu Dhabi", type: "Private Hospital" },
    { id: "DANAT", name: isRTL ? "مستشفى دانة الإمارات" : "Danat Al Emarat Hospital", location: "Abu Dhabi", type: "Private Hospital" },
  ];

  // Filter patients based on search type and query
  const filteredPatients = allPatients.filter(patient => {
    let matchesSearch = false;
    
    if (searchQuery === '') {
      matchesSearch = true;
    } else {
      switch (searchType) {
        case 'name':
          const fullName = `${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`.toLowerCase().trim();
          matchesSearch = fullName.includes(searchQuery.toLowerCase());
          break;
        case 'dob':
          matchesSearch = patient.dateOfBirth && patient.dateOfBirth.includes(searchQuery);
          break;
        case 'patientId':
          matchesSearch = patient.patientId.toLowerCase().includes(searchQuery.toLowerCase());
          break;
        default:
          matchesSearch = true;
      }
    }
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && patient.isActive) ||
      (statusFilter === 'inactive' && !patient.isActive);
    
    const matchesHospital = hospitalFilter === 'all' || patient.hospitalId === hospitalFilter;
    
    return matchesSearch && matchesStatus && matchesHospital;
  });

  const getPatientStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? (
          <div className={`flex items-center space-x-1 ${isRTL ? 'space-x-reverse' : ''}`}>
            <CheckCircle className="w-3 h-3" />
            <span>{t('active')}</span>
          </div>
        ) : (
          <div className={`flex items-center space-x-1 ${isRTL ? 'space-x-reverse' : ''}`}>
            <XCircle className="w-3 h-3" />
            <span>{t('inactive')}</span>
          </div>
        )}
      </Badge>
    );
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) => 
      regex.test(part) ? 
        <span key={index} className="bg-yellow-200 px-1 rounded">{part}</span> : 
        part
    );
  };

  return (
    <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">{t('patientManagement')}</h2>
        </div>
        <Button className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
          <Plus className="w-4 h-4" />
          <span>{t('addPatient')}</span>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className={`grid grid-cols-1 md:grid-cols-5 gap-4 ${isRTL ? 'rtl:text-right' : ''}`}>
            <div className="relative">
              <Search className={`absolute top-3 w-4 h-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={searchType === 'name' ? (isRTL ? 'البحث بالاسم' : 'Search by name') : 
                           searchType === 'dob' ? (isRTL ? 'البحث بتاريخ الميلاد' : 'Search by DOB') : 
                           (isRTL ? 'البحث برقم المريض' : 'Search by Patient ID')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'}`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            
            <Select value={searchType} onValueChange={(value) => setSearchType(value as 'name' | 'dob' | 'patientId')}>
              <SelectTrigger>
                <SelectValue placeholder={isRTL ? 'نوع البحث' : 'Search Type'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{isRTL ? 'الاسم' : 'Name'}</SelectItem>
                <SelectItem value="dob">{isRTL ? 'تاريخ الميلاد' : 'Date of Birth'}</SelectItem>
                <SelectItem value="patientId">{isRTL ? 'رقم المريض' : 'Patient ID'}</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger>
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'جميع الحالات' : 'All Status'}</SelectItem>
                <SelectItem value="active">{t('active')}</SelectItem>
                <SelectItem value="inactive">{t('inactive')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t('hospital')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'جميع المستشفيات' : 'All Hospitals'}</SelectItem>
                {hospitals.map(hospital => (
                  <SelectItem key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}
              onClick={() => setShowMissedReadingsReport(true)}
            >
              <Activity className="w-4 h-4" />
              <span>{isRTL ? 'تقرير القراءات الفائتة' : 'Missed Readings Report'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse text-right' : ''}`}>
            <span>{isRTL ? `المرضى (${filteredPatients.length})` : `Patients (${filteredPatients.length})`}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPatients ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">{t('loading')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${isRTL ? 'rtl' : ''}`}>
                <thead>
                  <tr className="border-b">
                    <th className={`p-3 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('patientId')}
                    </th>
                    <th className={`p-3 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('fullName')}
                    </th>
                    <th className={`p-3 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('contactInfo')}
                    </th>
                    <th className={`p-3 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('hospital')}
                    </th>
                    <th className={`p-3 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('status')}
                    </th>
                    <th className={`p-3 font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(patient => (
                    <tr key={patient.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-blue-600">
                            {highlightSearchTerm(patient.patientId, searchQuery)}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {highlightSearchTerm(
                              `${patient.firstName} ${patient.middleName || ''} ${patient.lastName}`.trim(),
                              searchQuery
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {patient.dateOfBirth && new Date(patient.dateOfBirth).toLocaleDateString(isRTL ? 'ar-AE' : 'en-US')}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">
                              {highlightSearchTerm(patient.email, searchQuery)}
                            </span>
                          </div>
                          <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{patient.mobileNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
                          <Hospital className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {hospitals.find(h => h.id === patient.hospitalId)?.name || patient.hospitalId}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        {getPatientStatusBadge(patient.isActive)}
                      </td>
                      <td className="p-3">
                        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowViewDialog(true);
                            }}
                          >
                            {t('view')}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowEditDialog(true);
                            }}
                          >
                            {t('edit')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredPatients.length === 0 && !loadingPatients && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">{isRTL ? 'لم يتم العثور على مرضى' : 'No patients found'}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Patient Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className={`sm:max-w-2xl ${isRTL ? 'rtl' : ''}`}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>
              {t('patientDetails')}
            </DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={`text-sm font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'} block`}>
                    {t('fullName')}
                  </Label>
                  <p className={`text-lg font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                    {selectedPatient.firstName} {selectedPatient.middleName || ''} {selectedPatient.lastName}
                  </p>
                </div>
                <div>
                  <Label className={`text-sm font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'} block`}>
                    {t('patientId')}
                  </Label>
                  <p className={`text-lg font-semibold ${isRTL ? 'text-right' : 'text-left'}`}>
                    {selectedPatient.patientId}
                  </p>
                </div>
                <div>
                  <Label className={`text-sm font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'} block`}>
                    {t('email')}
                  </Label>
                  <p className={`text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                    {selectedPatient.email}
                  </p>
                </div>
                <div>
                  <Label className={`text-sm font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'} block`}>
                    {t('mobileNumber')}
                  </Label>
                  <p className={`text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                    {selectedPatient.mobileNumber}
                  </p>
                </div>
                <div>
                  <Label className={`text-sm font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'} block`}>
                    {t('hospital')}
                  </Label>
                  <p className={`text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                    {hospitals.find(h => h.id === selectedPatient.hospitalId)?.name || selectedPatient.hospitalId}
                  </p>
                </div>
                <div>
                  <Label className={`text-sm font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'} block`}>
                    {t('status')}
                  </Label>
                  {getPatientStatusBadge(selectedPatient.isActive)}
                </div>
              </div>
              <div className={`flex justify-end gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  {t('close')}
                </Button>
                <Button onClick={() => {
                  setShowViewDialog(false);
                  setShowEditDialog(true);
                }}>
                  {t('editPatient')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog - Placeholder for now */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className={`sm:max-w-2xl ${isRTL ? 'rtl' : ''}`}>
          <DialogHeader>
            <DialogTitle className={isRTL ? 'text-right' : 'text-left'}>
              {t('editPatient')}
            </DialogTitle>
          </DialogHeader>
          <div className={`text-center py-8 ${isRTL ? 'text-right' : 'text-left'}`}>
            <p className="text-gray-600">
              {isRTL ? 'نموذج تعديل المريض سيتم تنفيذه قريباً' : 'Edit patient form coming soon'}
            </p>
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              className="mt-4"
            >
              {t('close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Missed Readings Report */}
      <MissedReadingsReport 
        isOpen={showMissedReadingsReport} 
        onClose={() => setShowMissedReadingsReport(false)} 
      />
    </div>
  );
}
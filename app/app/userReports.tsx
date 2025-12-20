import { View, Text, Image, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert, TextInput, Modal } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/clerk-expo'
import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FontAwesome5 } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Report } from '../interface/report'
import * as ImagePicker from 'expo-image-picker'

const userReports = () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL
    const { user } = useUser()
    const { getToken } = useAuth()
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [editingReport, setEditingReport] = useState<Report | null>(null)
    const [editForm, setEditForm] = useState({
        location: '',
        vehicleNumber: '',
        vehicleType: '',
        vehicleColor: '',
        vehicleModel: '',
        harassmentType: '',
        extraInfo: '',
        image: ''
    })

    const getUserReports = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) setLoading(true)
            const token = await getToken()
            const res = await fetch(`${apiUrl}/report-harassment/user?userId=${user?.id}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            })

            if (res.ok) {
                const data = await res.json()
                setReports(data)
            }
        } catch (error) {
            console.error('Error fetching reports', error)
        } finally {
            setLoading(false)
            if (isRefreshing) setRefreshing(false)
        }
    }

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true
        })

        if (!result.canceled) {
            setEditForm(
                {
                    location: editForm.location,
                    vehicleNumber: editForm.vehicleNumber,
                    vehicleType: editForm.vehicleType,
                    vehicleColor: editForm.vehicleColor,
                    vehicleModel: editForm.vehicleModel,
                    harassmentType: editForm.harassmentType,
                    extraInfo: editForm.extraInfo,
                    image: result.assets[0].uri
                })
        }
    }

    const onRefresh = () => {
        setRefreshing(true)
        getUserReports(true)
    }

    useEffect(() => {
        getUserReports()
    }, [])

    const confirmDelete = (reportId: number) => {
        Alert.alert(
            'Delete Report',
            'Are you sure you want to delete this report? This action cannot be undone.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteReport(reportId)
                }
            ],
            { cancelable: true }
        )
    }

    const deleteReport = async (reportId: number) => {
        try {
            const token = await getToken()
            const res = await fetch(`${apiUrl}/report-harassment/${reportId}/user/${user?.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })

            const data = await res.json()
            if (data.success) {
                setReports((prevReports) => prevReports.filter((report) => report.id !== reportId))
                Alert.alert('Success', 'Report deleted successfully')
            } else {
                Alert.alert('Error', 'Failed to delete report')
            }
        } catch (err) {
            console.error("Error deleting post:", err);
            Alert.alert('Error', 'Something went wrong while deleting the report')
        }
    }

    const editReport = (report: Report) => {
        setEditingReport(report)
        setEditForm({
            location: report.location || '',
            vehicleNumber: report.vehicleNumber || '',
            vehicleType: report.vehicleType || '',
            vehicleColor: report.vehicleColor || '',
            vehicleModel: report.vehicleModel || '',
            harassmentType: report.harassmentType || '',
            extraInfo: report.extraInfo || '',
            image: report.image || ''
        })
    }

    const closeEditModal = () => {
        setEditingReport(null)
        setEditForm({
            location: '',
            vehicleNumber: '',
            vehicleType: '',
            vehicleColor: '',
            vehicleModel: '',
            harassmentType: '',
            extraInfo: '',
            image: ''
        })
    }

    const saveEditedReport = async () => {
        if (!editingReport) return

        try {
            const token = await getToken()
            const res = await fetch(`${apiUrl}/report-harassment`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editForm)
            })

            const data = await res.json()
            if (data.success || res.ok) {
                setReports((prevReports) =>
                    prevReports.map((report) =>
                        report.id === editingReport.id
                            ? { ...report, ...editForm }
                            : report
                    )
                )
                Alert.alert('Success', 'Report updated successfully')
                closeEditModal()
            } else {
                Alert.alert('Error', 'Failed to update report')
            }
        } catch (err) {
            console.error("Error updating report:", err);
            Alert.alert('Error', 'Something went wrong while updating the report')
        }
    }

    return (
        <LinearGradient
            colors={['#4A0E4E', '#000000', '#000000']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <ScrollView

                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#b24bf3"
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerSec}>
                        <TouchableOpacity onPress={() => router.back()}><FontAwesome5 name='arrow-left' color={'white'} size={20} /></TouchableOpacity>
                        <Text style={styles.headerTitle}>My Reports</Text></View>
                    <Text style={styles.headerSubtitle}>
                        Track your harassment reports
                    </Text>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#b24bf3" />
                        <Text style={styles.loadingText}>Loading reports...</Text>
                    </View>
                ) : reports && reports.length > 0 ? (
                    <View style={styles.reportsContainer}>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>
                                {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
                            </Text>
                        </View>

                        {reports.map((report: any, index: number) => (
                            <View key={index} style={styles.reportCard}>
                                {/* Action Buttons */}
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        onPress={() => editReport(report)}
                                        style={styles.actionButton}
                                    >
                                        <FontAwesome5 name='pen' color={'#b24bf3'} size={16} />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => confirmDelete(report.id)}
                                        style={styles.actionButton}
                                    >
                                        <FontAwesome5 name='trash-alt' color={'#ff4444'} size={16} />
                                    </TouchableOpacity>
                                </View>

                                {/* Status Indicator */}
                                <View style={styles.statusBar} />

                                {/* Report Type Badge */}
                                <View style={styles.typeBadge}>
                                    <Text style={styles.typeBadgeText}>
                                        {report.harassmentType || 'Unreported'}
                                    </Text>
                                </View>

                                {/* Date */}
                                <Text style={styles.dateText}>
                                    {report.createdAt
                                        ? new Date(report.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : 'Date not available'}
                                </Text>

                                {/* Location */}
                                {report.location && (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.iconText}><FontAwesome5 name='map-marker-alt' size={20} color={'white'} /></Text>
                                        <Text style={styles.infoText}>{report.location}</Text>
                                    </View>
                                )}

                                {report.vehicleNumber && (
                                    <View style={styles.extraInfoContainer}>
                                        <Text style={styles.sectionLabel}>Vehicle No.</Text>
                                        <Text style={styles.extraInfoText}>{report.vehicleNumber}</Text>
                                    </View>
                                )}

                                {/* Extra Info */}
                                {report.extraInfo && (
                                    <View style={styles.extraInfoContainer}>
                                        <Text style={styles.sectionLabel}>Additional Information</Text>
                                        <Text style={styles.extraInfoText}>{report.extraInfo}</Text>
                                    </View>
                                )}


                                {/* Evidence Image */}
                                {report.image && (
                                    <View style={styles.imageContainer}>
                                        <Text style={styles.sectionLabel}>Evidence</Text>
                                        <View style={styles.imageWrapper}>
                                            <Image
                                                source={{ uri: report.image }}
                                                style={styles.reportImage}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📋</Text>
                        <Text style={styles.emptyTitle}>No Reports Yet</Text>
                        <Text style={styles.emptyText}>
                            You haven't submitted any reports. Your reports will appear here.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Edit Modal */}
            <Modal
                visible={editingReport !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={closeEditModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Report</Text>
                            <TouchableOpacity onPress={closeEditModal}>
                                <FontAwesome5 name="times" size={24} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScrollView}>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Location</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={editForm.location}
                                    onChangeText={(text) => setEditForm({ ...editForm, location: text })}
                                    placeholder="Enter location"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Harassment Type</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={editForm.harassmentType}
                                    onChangeText={(text) => setEditForm({ ...editForm, harassmentType: text })}
                                    placeholder="Enter harassment type"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Vehicle Number</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={editForm.vehicleNumber}
                                    onChangeText={(text) => setEditForm({ ...editForm, vehicleNumber: text })}
                                    placeholder="Enter vehicle number"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Vehicle Type</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={editForm.vehicleType}
                                    onChangeText={(text) => setEditForm({ ...editForm, vehicleType: text })}
                                    placeholder="Enter vehicle type"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Vehicle Color</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={editForm.vehicleColor}
                                    onChangeText={(text) => setEditForm({ ...editForm, vehicleColor: text })}
                                    placeholder="Enter vehicle color"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Vehicle Model</Text>
                                <TextInput
                                    style={styles.formInput}
                                    value={editForm.vehicleModel}
                                    onChangeText={(text) => setEditForm({ ...editForm, vehicleModel: text })}
                                    placeholder="Enter vehicle model"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Additional Information</Text>
                                <TextInput
                                    style={[styles.formInput, styles.formTextArea]}
                                    value={editForm.extraInfo}
                                    onChangeText={(text) => setEditForm({ ...editForm, extraInfo: text })}
                                    placeholder="Enter additional information"
                                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Evidence: </Text>
                                {editForm.image && (
                                    <View >
                                        <Image
                                            source={{ uri: editForm.image }}
                                            style={styles.reportImage}
                                            resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                            style={styles.modalButton}
                                            onPress={pickImage}
                                            disabled={loading}
                                        >
                                            <Text style={styles.buttonText}> Gallery</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={closeEditModal}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={saveEditedReport}
                            >
                                <Text style={styles.buttonText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
        marginTop: 40,
    },
    headerSec: {
        display: 'flex',
        flexDirection: 'row',
        gap: 20
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 6,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 12,
        fontSize: 16,
    },
    reportsContainer: {
        marginTop: 8,
    },
    countBadge: {
        backgroundColor: 'rgba(178, 75, 243, 0.2)',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignSelf: 'flex-start',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(178, 75, 243, 0.4)',
    },
    countText: {
        color: '#b24bf3',
        fontSize: 14,
        fontWeight: '600',
    },
    reportCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    actionButtons: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        gap: 8,
        zIndex: 10,
    },
    actionButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statusBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: '#b24bf3',
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    typeBadge: {
        backgroundColor: 'rgba(178, 75, 243, 0.25)',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignSelf: 'flex-start',
        marginBottom: 12,
    },
    typeBadgeText: {
        color: '#e0b3ff',
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    dateText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 13,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 10,
    },
    iconText: {
        fontSize: 16,
        marginRight: 8,
    },
    infoText: {
        color: '#fff',
        fontSize: 15,
        flex: 1,
    },
    descriptionContainer: {
        marginTop: 8,
        marginBottom: 12,
    },
    extraInfoContainer: {
        marginTop: 8,
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#b24bf3',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    descriptionText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 15,
        lineHeight: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 10,
    },
    extraInfoText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        lineHeight: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 10,
    },
    imageContainer: {
        marginTop: 12,
    },
    imageWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    reportImage: {
        width: '100%',
        height: 220,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        lineHeight: 22,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#1a1a1a',
        borderRadius: 20,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(178, 75, 243, 0.3)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    modalScrollView: {
        maxHeight: 400,
    },
    formGroup: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#b24bf3',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    formInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        padding: 12,
        color: '#fff',
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    formTextArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    saveButton: {
        backgroundColor: '#b24bf3',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})

export default userReports
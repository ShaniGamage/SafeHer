import { useAuth, useUser } from '@clerk/clerk-expo';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Image,
  Modal,
  FlatList,
  RefreshControl
} from 'react-native';
import * as Location from "expo-location"
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Contacts from "expo-contacts"
import { homeStyles } from '../../styles/index';
import { Contact, DeviceContact } from '../../interface/contact';
import { useSOS } from '@/hooks/useSOS';
import FindNearestPolice from '@/components/features/findNearestPolice';
import { locationService } from '@/services/location.service';

export default function HomeScreen() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL
  const { getToken } = useAuth();
  const { user } = useUser();
  
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null)
  const [address, setAddress] = useState<string>('')
  const [unsafe, setUnsafe] = useState<boolean>(false)
  const [sosCount, setSosCount] = useState<number>(0)
  const [harassmentCount, setHarassmentCount] = useState<number>(0)
  const [loadingCounts, setLoadingCounts] = useState(false)
  const [vehicleNo, setVehicleNo] = useState<string>('')
  const [harassmentReports, setHarassmentReports] = useState<any>(null);
  const [searchingVehicle, setSearchingVehicle] = useState(false);
  const [existingContacts, setExistingContacts] = useState<Contact[]>([])

  const { sendSOS, loading: sosLoading, error: sosError } = useSOS(apiUrl, user?.id);
  
  // Contact picker states 
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState<DeviceContact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [savingContacts, setSavingContacts] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  const [region, setRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const router = useRouter()

  // Filter contacts based on search query
  const filteredContacts = deviceContacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
    contact.phoneNumbers?.[0]?.number?.includes(contactSearchQuery)
  );

  useEffect(() => {
    initializeLocation();
  }, []);

  useEffect(() => {
    getExistingContacts()
  }, [])

  useEffect(() => {
    fetchReports();
  }, []);

  const initializeLocation = async () => {
    setUnsafe(true)
    setLoadingCounts(true)
    try {
      const loc = await locationService.getCurrentLocation()
      if (!loc) {
        setError('Location permission denied or unavailable.')
        return
      }
      setLocation(loc);
      const { latitude, longitude } = loc.coords

      const currentRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(currentRegion);

      const geo = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      })

      if (geo.length > 0) {
        const item = geo[0]
        const addressParts = [
          item.streetNumber,
          item.street,
          item.city,
          item.district,
          item.region,
          item.country,
          item.postalCode
        ].filter(part => part);
        const fullAddress = addressParts.join(', ');
        setAddress(fullAddress);
      }

      const bounds = {
        minLat: currentRegion.latitude - currentRegion.latitudeDelta / 2,
        maxLat: currentRegion.latitude + currentRegion.latitudeDelta / 2,
        minLng: currentRegion.longitude - currentRegion.longitudeDelta / 2,
        maxLng: currentRegion.longitude + currentRegion.longitudeDelta / 2,
      };

      const response = await fetch(`${apiUrl}/safe-route/heatmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bounds),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const firstFeature = data.features[0];
          if (firstFeature.properties) {
            const totalSos = firstFeature.properties.sosCount || 0;
            const totalHarassment = firstFeature.properties.harassmentCount || 0;

            setSosCount(totalSos);
            setHarassmentCount(totalHarassment);

            const totalIncidents = data.stats?.totalIncidents || 0;
            setUnsafe(totalSos > 0 || totalHarassment > 5);
          }
        } else {
          setSosCount(0);
          setHarassmentCount(0);
          setUnsafe(false);
        }
      }
    } catch (err) {
      console.error("Location/Heatmap error:", err);
      Alert.alert('Error', 'Failed to get location data');
    } finally {
      setLoadingCounts(false);
    }
  };

  const pickContacts = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant contacts permission to add emergency contacts');
      return;
    }
    setLoadingContacts(true);
    try {
      const response = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      if (response.data && response.data.length > 0) {
        const contactsWithPhones = response.data.filter(
          contact => contact.phoneNumbers && contact.phoneNumbers.length > 0
        );
        setDeviceContacts(contactsWithPhones);
        setShowContactPicker(true);
      } else {
        Alert.alert('No Contacts', 'No contacts found on your device');
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  }

  const getExistingContacts = async () => {
    try {
      const token = await getToken()
      const res = await fetch(`${apiUrl}/sos/contacts?userId=${user?.id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setExistingContacts(data)
      }
    } catch (error) {
      console.error('Error fetching contacts', error)
    }
  }

  const toggleContactSelection = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      // Limit to 5 contacts
      if (newSelected.size >= 5) {
        Alert.alert('Limit Reached', 'You can only select up to 5 emergency contacts');
        return;
      }
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
  }

  const saveSelectedContacts = async () => {
    if (selectedContacts.size === 0) {
      Alert.alert('No Selection', 'Please select at least one contact');
      return;
    }
    setSavingContacts(true);
    try {
      const token = await getToken();

      const contactsToSave = deviceContacts
        .filter(c => selectedContacts.has(c.id))
        .map(c => ({
          name: c.name,
          phoneNumber: c.phoneNumbers?.[0]?.number || ''
        }));

      const response = await fetch(`${apiUrl}/sos/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user?.id, contacts: contactsToSave })
      });

      if (response.ok) {
        Alert.alert('Success', 'Emergency contacts added successfully');
        setShowContactPicker(false);
        setSelectedContacts(new Set());
        setContactSearchQuery('');
        await getExistingContacts();
      } else {
        throw new Error('Failed to save contacts');
      }
    } catch (error) {
      console.error('Error saving contacts:', error);
      Alert.alert('Error', 'Failed to save emergency contacts');
    } finally {
      setSavingContacts(false);
    }
  }

  const removeContact = async (contactId: number) => {
    try {
      if (!contactId) {
        return
      }
      const res = await fetch(`${apiUrl}/sos/contacts/${contactId}/user/${user?.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      if (data.success) {
        setExistingContacts((prevContacts) => prevContacts.filter((contact) => contact.id !== contactId));
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  }

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();

      if (!token) {
        throw new Error('No authentication token');
      }
      const response = await fetch(`${apiUrl}/reports/mine`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      const data = await response.json();
      setReports(data);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getReportsByVehicleNo = async (vehicleNumber: string) => {
    if (!vehicleNumber.trim()) {
      Alert.alert('Error', 'Please enter a vehicle number');
      return;
    }

    try {
      setSearchingVehicle(true);
      setError(null);
      const token = await getToken();

      if (!token) {
        throw new Error('No authentication token');
      }
      const response = await fetch(`${apiUrl}/report-harassment?vehicleNo=${encodeURIComponent(vehicleNumber)}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setHarassmentReports(data);

      if (data && data.length > 0) {
        Alert.alert(
          'Reports Found',
          `Found ${data.length} report(s) for vehicle ${vehicleNumber}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'No Reports',
          `No reports found for vehicle ${vehicleNumber}`,
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
      Alert.alert('Error', err.message);
    } finally {
      setSearchingVehicle(false);
    }
  }

  //  await async operations in onRefresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        getExistingContacts(),
        fetchReports(),
        initializeLocation()
      ]);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Render individual contact item in picker
  const renderContactItem = ({ item }: { item: DeviceContact }) => {
    const isSelected = selectedContacts.has(item.id);
    const phoneNumber = item.phoneNumbers?.[0]?.number || 'No number';

    return (
      <TouchableOpacity
        style={[
          homeStyles.contactPickerItem,
          isSelected && homeStyles.contactPickerItemSelected
        ]}
        onPress={() => toggleContactSelection(item.id)}
      >
        <View style={homeStyles.contactPickerLeft}>
          <View style={[
            homeStyles.checkbox,
            isSelected && homeStyles.checkboxSelected
          ]}>
            {isSelected && (
              <FontAwesome5 name="check" size={12} color="#fff" />
            )}
          </View>
          <View style={homeStyles.contactPickerInfo}>
            <Text style={homeStyles.contactPickerName}>{item.name}</Text>
            <Text style={homeStyles.contactPickerPhone}>{phoneNumber}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !reports) {
    return (
      <View style={homeStyles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={homeStyles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  if (error && !reports) {
    return (
      <View style={homeStyles.centerContainer}>
        <Text style={homeStyles.errorTitle}>Error Loading Reports</Text>
        <Text style={homeStyles.errorText}>{error}</Text>
        <TouchableOpacity style={homeStyles.retryButton} onPress={fetchReports}>
          <Text style={homeStyles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#4A0E4E', 'black', 'black']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      {/* CONTACT PICKER MODAL */}
      <Modal
        visible={showContactPicker}
        animationType="slide"
        transparent={false}
      >
        <LinearGradient
          colors={['#4A0E4E', 'black']}
          style={homeStyles.modalContainer}
        >
          <View style={homeStyles.modalHeader}>
            <Text style={homeStyles.modalTitle}>Select Emergency Contacts</Text>
            <Text style={homeStyles.modalSubtitle}>
              {selectedContacts.size}/5 selected
            </Text>
          </View>

          {/* Search Bar */}
          <View style={homeStyles.searchBarContainer}>
            <FontAwesome5 name="search" size={16} color="#999" />
            <TextInput
              style={homeStyles.searchBar}
              placeholder="Search contacts..."
              placeholderTextColor="#999"
              value={contactSearchQuery}
              onChangeText={setContactSearchQuery}
            />
            {contactSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setContactSearchQuery('')}>
                <FontAwesome5 name="times-circle" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Contacts List */}
          <FlatList
            data={filteredContacts}
            renderItem={renderContactItem}
            keyExtractor={(item) => item.id}
            style={homeStyles.contactsList}
            contentContainerStyle={homeStyles.contactsListContent}
            ListEmptyComponent={
              <View style={homeStyles.emptyContainer}>
                <FontAwesome5 name="address-book" size={50} color="#666" />
                <Text style={homeStyles.emptyText}>
                  {contactSearchQuery ? 'No contacts found' : 'No contacts available'}
                </Text>
              </View>
            }
          />

          {/* Action Buttons */}
          <View style={homeStyles.modalActions}>
            <TouchableOpacity
              style={[homeStyles.modalButton, homeStyles.cancelButton]}
              onPress={() => {
                setShowContactPicker(false);
                setSelectedContacts(new Set());
                setContactSearchQuery('');
              }}
              disabled={savingContacts}
            >
              <Text style={homeStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                homeStyles.modalButton,
                homeStyles.saveButton,
                (selectedContacts.size === 0 || savingContacts) && homeStyles.saveButtonDisabled
              ]}
              onPress={saveSelectedContacts}
              disabled={selectedContacts.size === 0 || savingContacts}
            >
              {savingContacts ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={homeStyles.saveButtonText}>
                  Save ({selectedContacts.size})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#b24bf3', '#FF1493']}
            progressBackgroundColor="#4A0E4E"
          />
        }
      >
        <View style={homeStyles.header}>
          <Text style={homeStyles.title}>
            Welcome, {user?.firstName || 'User'}!
          </Text>
        </View>

        <View style={homeStyles.address}>
          <Text style={homeStyles.addressTxt}>
            <FontAwesome5 name="map-marker-alt" size={20} color="white" /> {address}
          </Text>
        </View>
        <View><FindNearestPolice /></View>

        {/* Safety Statistics Card */}
        <View style={homeStyles.statsCard}>
          <Text style={homeStyles.statsTitle}>Area Safety Report</Text>
          {loadingCounts ? (
            <ActivityIndicator size="small" color="#FF1493" />
          ) : (
            <View style={homeStyles.statsContainer}>
              <View style={homeStyles.statItem}>
                <FontAwesome5 name="bell" size={30} color="#FF4444" />
                <Text style={homeStyles.statNumber}>{sosCount}</Text>
                <Text style={homeStyles.statLabel}>SOS Alerts</Text>
              </View>
              <View style={homeStyles.statDivider} />
              <View style={homeStyles.statItem}>
                <FontAwesome5 name="exclamation-triangle" size={30} color="#FF9800" />
                <Text style={homeStyles.statNumber}>{harassmentCount}</Text>
                <Text style={homeStyles.statLabel}>Harassment Reports</Text>
              </View>
            </View>
          )}

          <View style={[homeStyles.safetyBadge, unsafe ? homeStyles.unsafeBadge : homeStyles.safeBadge]}>
            <FontAwesome5
              name={unsafe ? "exclamation-circle" : "shield-alt"}
              size={16}
              color="white"
            />
            <Text style={homeStyles.safetyText}>
              {unsafe ? "High Risk Area" : "Safe Area"}
            </Text>
          </View>
        </View>

        <View style={homeStyles.buttonsRow}>
          <TouchableOpacity onPress={sendSOS} style={homeStyles.button}>
            <FontAwesome5 name="bell" size={24} color="#fff" />
            <Text style={homeStyles.buttonText}>Send SOS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={homeStyles.button}
            onPress={() =>
              router.push({
                pathname: "/fakeCall",
                params: { callerName: "Emergency Contact" },
              })
            }
          >
            <FontAwesome5 name="phone" size={24} color="#fff" />
            <Text style={homeStyles.buttonText}>Fake Call</Text>
          </TouchableOpacity>
        </View>

        {/* Vehicle Search Section */}
        <View style={homeStyles.searchCard}>
          <Text style={homeStyles.searchTitle}>Search Vehicle Reports</Text>
          <View style={homeStyles.searchContainer}>
            <TextInput
              value={vehicleNo}
              onChangeText={setVehicleNo}
              placeholder="Enter vehicle number"
              placeholderTextColor="#999"
              style={homeStyles.searchInput}
            />
            <TouchableOpacity
              onPress={() => getReportsByVehicleNo(vehicleNo)}
              style={homeStyles.searchButton}
              disabled={searchingVehicle}
            >
              {searchingVehicle ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome5 name="search" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {/* Display Vehicle Reports */}
          {harassmentReports && harassmentReports.length > 0 && (
            <View style={homeStyles.reportsContainer}>
              <Text style={homeStyles.reportsTitle}>
                Reports for {vehicleNo} ({harassmentReports.length})
              </Text>
              {harassmentReports.map((report: any, index: number) => (
                <View key={index} style={homeStyles.reportItem}>
                  <Text style={homeStyles.reportText}>
                    <Text style={homeStyles.reportLabel}>Type:</Text> {report.harassmentType || 'N/A'}
                  </Text>
                  <Text style={homeStyles.reportText}>
                    <Text style={homeStyles.reportLabel}>Location:</Text> {report.location || 'N/A'}
                  </Text>
                  <Text style={homeStyles.reportText}>
                    <Text style={homeStyles.reportLabel}>Extra-info:</Text> {report.extraInfo || 'N/A'}
                  </Text>
                  {report.image && (
                    <View style={homeStyles.imageContainer}>
                      <Text style={homeStyles.reportLabel}>Evidence:</Text>
                      <Image
                        source={{ uri: report.image }}
                        style={homeStyles.reportImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  <Text style={homeStyles.reportText}>
                    <Text style={homeStyles.reportLabel}>Date:</Text> {
                      report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString()
                        : 'N/A'
                    }
                  </Text>
                  {report.description && (
                    <Text style={homeStyles.reportText}>
                      <Text style={homeStyles.reportLabel}>Details:</Text> {report.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Emergency Contacts Section */}
        <View style={homeStyles.contactsCard}>
          <View style={homeStyles.contactsHeader}>
            <Text style={homeStyles.contactsTitle}>Emergency Contacts</Text>
            <TouchableOpacity
              onPress={pickContacts}
              style={homeStyles.addContactButton}
              disabled={loadingContacts}
            >
              {loadingContacts ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome5 name="plus" size={16} color="#fff" />
                  <Text style={homeStyles.addContactText}>Add</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {existingContacts.length > 0 ? (
            <View style={homeStyles.contactsListContainer}>
              {existingContacts.map((contact, index) => (
                <View key={index} style={homeStyles.contactItem}>
                  <FontAwesome5 name="user-circle" size={24} color="#b24bf3" />
                  <View style={homeStyles.contactInfo}>
                    <Text style={homeStyles.contactName}>{contact.name}</Text>
                    <Text style={homeStyles.contactPhone}>{contact.phoneNumber}</Text>
                    <TouchableOpacity onPress={() => removeContact(contact.id)}>
                      <FontAwesome5 name="trash-alt" size={10} color='red' />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={homeStyles.noContactsText}>
              No emergency contacts added yet. Tap "Add" to select contacts.
            </Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  )
}
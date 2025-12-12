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
  FlatList
} from 'react-native';
import * as Location from "expo-location"
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Contacts from "expo-contacts"
import { styles } from './styles/home.styles';
import { Contact } from './types/home.types';
import { DeviceContact } from './types/home.types';

export default function HomeScreen() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL
  const { getToken } = useAuth();
  const { user } = useUser();
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
    (async () => {
      setUnsafe(true)
      setLoadingCounts(true)
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission denied", "Location access is required.");
          setLoadingCounts(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);

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
    })();
  }, []);

  useEffect(() => {
    getExistingContacts()
  }, [])

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
        body: JSON.stringify({ userId: user?.id,contacts: contactsToSave })
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

  const sendSOS = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert("permission required")
        return
      }

      const loc = await Location.getCurrentPositionAsync({})
      const address = await Location.reverseGeocodeAsync(loc.coords)
      const addressObj = address[0];
      const addressStr = [
        addressObj.streetNumber,
        addressObj.street,
        addressObj.city,
        addressObj.region,
        addressObj.country,
        addressObj.postalCode
      ].filter(Boolean).join(', ');

      const payload = {
        userId: user?.id,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: addressStr,
        createdAt: new Date().toISOString(),
      }
      await fetch(`${apiUrl}/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      Alert.alert("SOS sent", "Your emergency contacts have been notified")
    } catch (error) {
      console.error("SOS error", error)
      Alert.alert("Error", "Failed to send SOS. Please try again.")
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

  useEffect(() => {
    fetchReports();
  }, []);

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

  // Render individual contact item in picker
  const renderContactItem = ({ item }: { item: DeviceContact }) => {
    const isSelected = selectedContacts.has(item.id);
    const phoneNumber = item.phoneNumbers?.[0]?.number || 'No number';

    return (
      <TouchableOpacity
        style={[
          styles.contactPickerItem,
          isSelected && styles.contactPickerItemSelected
        ]}
        onPress={() => toggleContactSelection(item.id)}
      >
        <View style={styles.contactPickerLeft}>
          <View style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected
          ]}>
            {isSelected && (
              <FontAwesome5 name="check" size={12} color="#fff" />
            )}
          </View>
          <View style={styles.contactPickerInfo}>
            <Text style={styles.contactPickerName}>{item.name}</Text>
            <Text style={styles.contactPickerPhone}>{phoneNumber}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !reports) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  if (error && !reports) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Error Loading Reports</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
          <Text style={styles.retryButtonText}>Retry</Text>
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
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Emergency Contacts</Text>
            <Text style={styles.modalSubtitle}>
              {selectedContacts.size}/5 selected
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <FontAwesome5 name="search" size={16} color="#999" />
            <TextInput
              style={styles.searchBar}
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
            style={styles.contactsList}
            contentContainerStyle={styles.contactsListContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesome5 name="address-book" size={50} color="#666" />
                <Text style={styles.emptyText}>
                  {contactSearchQuery ? 'No contacts found' : 'No contacts available'}
                </Text>
              </View>
            }
          />

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => {
                setShowContactPicker(false);
                setSelectedContacts(new Set());
                setContactSearchQuery('');
              }}
              disabled={savingContacts}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.saveButton,
                (selectedContacts.size === 0 || savingContacts) && styles.saveButtonDisabled
              ]}
              onPress={saveSelectedContacts}
              disabled={selectedContacts.size === 0 || savingContacts}
            >
              {savingContacts ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  Save ({selectedContacts.size})
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Modal>

      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>
            Welcome, {user?.firstName || 'User'}!
          </Text>
        </View>

        <View style={styles.address}>
          <Text style={styles.addressTxt}>
            <FontAwesome5 name="map-marker-alt" size={20} color="white" /> {address}
          </Text>
        </View>

        {/* Safety Statistics Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Area Safety Report</Text>
          {loadingCounts ? (
            <ActivityIndicator size="small" color="#FF1493" />
          ) : (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <FontAwesome5 name="bell" size={30} color="#FF4444" />
                <Text style={styles.statNumber}>{sosCount}</Text>
                <Text style={styles.statLabel}>SOS Alerts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <FontAwesome5 name="exclamation-triangle" size={30} color="#FF9800" />
                <Text style={styles.statNumber}>{harassmentCount}</Text>
                <Text style={styles.statLabel}>Harassment Reports</Text>
              </View>
            </View>
          )}

          <View style={[styles.safetyBadge, unsafe ? styles.unsafeBadge : styles.safeBadge]}>
            <FontAwesome5
              name={unsafe ? "exclamation-circle" : "shield-alt"}
              size={16}
              color="white"
            />
            <Text style={styles.safetyText}>
              {unsafe ? "High Risk Area" : "Safe Area"}
            </Text>
          </View>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity onPress={sendSOS} style={styles.button}>
            <FontAwesome5 name="bell" size={24} color="#fff" />
            <Text style={styles.buttonText}>Send SOS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              router.push({
                pathname: "/fakeCall",
                params: { callerName: "Emergency Contact" },
              })
            }
          >
            <FontAwesome5 name="phone" size={24} color="#fff" />
            <Text style={styles.buttonText}>Fake Call</Text>
          </TouchableOpacity>
        </View>

        {/* Vehicle Search Section */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Search Vehicle Reports</Text>
          <View style={styles.searchContainer}>
            <TextInput
              value={vehicleNo}
              onChangeText={setVehicleNo}
              placeholder="Enter vehicle number"
              placeholderTextColor="#999"
              style={styles.searchInput}
            />
            <TouchableOpacity
              onPress={() => getReportsByVehicleNo(vehicleNo)}
              style={styles.searchButton}
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
            <View style={styles.reportsContainer}>
              <Text style={styles.reportsTitle}>
                Reports for {vehicleNo} ({harassmentReports.length})
              </Text>
              {harassmentReports.map((report: any, index: number) => (
                <View key={index} style={styles.reportItem}>
                  <Text style={styles.reportText}>
                    <Text style={styles.reportLabel}>Type:</Text> {report.harassmentType || 'N/A'}
                  </Text>
                  <Text style={styles.reportText}>
                    <Text style={styles.reportLabel}>Location:</Text> {report.location || 'N/A'}
                  </Text>
                  <Text style={styles.reportText}>
                    <Text style={styles.reportLabel}>Extra-info:</Text> {report.extraInfo || 'N/A'}
                  </Text>
                  {report.image && (
                    <View style={styles.imageContainer}>
                      <Text style={styles.reportLabel}>Evidence:</Text>
                      <Image
                        source={{ uri: report.image }}
                        style={styles.reportImage}
                        resizeMode="cover"
                      />
                    </View>
                  )}
                  <Text style={styles.reportText}>
                    <Text style={styles.reportLabel}>Date:</Text> {
                      report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString()
                        : 'N/A'
                    }
                  </Text>
                  {report.description && (
                    <Text style={styles.reportText}>
                      <Text style={styles.reportLabel}>Details:</Text> {report.description}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Emergency Contacts Section */}
        <View style={styles.contactsCard}>
          <View style={styles.contactsHeader}>
            <Text style={styles.contactsTitle}>Emergency Contacts</Text>
            <TouchableOpacity
              onPress={pickContacts}
              style={styles.addContactButton}
              disabled={loadingContacts}
            >
              {loadingContacts ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome5 name="plus" size={16} color="#fff" />
                  <Text style={styles.addContactText}>Add</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {existingContacts.length > 0 ? (
            <View style={styles.contactsListContainer}>
              {existingContacts.map((contact, index) => (
                <View key={index} style={styles.contactItem}>
                  <FontAwesome5 name="user-circle" size={24} color="#b24bf3" />
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phoneNumber}</Text>
                    <TouchableOpacity onPress={() => removeContact(contact.id)}>
                      <FontAwesome5 name="trash-alt" size={10} color='red' />
                    </TouchableOpacity>

                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noContactsText}>
              No emergency contacts added yet. Tap "Add" to select contacts.
            </Text>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

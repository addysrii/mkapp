// src/screens/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Dimensions,
  PixelRatio
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const EditProfileScreen = ({ route }) => {
  const navigation = useNavigation();
  const { currentUser, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeSection, setActiveSection] = useState(route?.params?.section || 'basic');
  const [localProfile, setLocalProfile] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    birthday: null,
    gender: '',
    skills: [],
    interests: {
      topics: [],
      industries: []
    },
    languages: [],
    experience: [],
    education: [],
    socialLinks: []
  });
  
  // Add state for various form items
  const [newSkill, setNewSkill] = useState('');
  const [newInterestTopic, setNewInterestTopic] = useState('');
  const [newLanguage, setNewLanguage] = useState({ language: '', proficiency: 'basic' });
  const [newSocialLink, setNewSocialLink] = useState({ platform: '', url: '' });
  const [imageUpload, setImageUpload] = useState(null);
  const [error, setError] = useState(null);
  
  // Experience form state
  const [experienceForm, setExperienceForm] = useState({
    company: '',
    position: '',
    location: '',
    startDate: null,
    endDate: null,
    current: false,
    description: '',
    skills: []
  });
  
  // Education form state
  const [educationForm, setEducationForm] = useState({
    institution: '',
    degree: '',
    field: '',
    startDate: null,
    endDate: null,
    current: false,
    description: ''
  });
  
  // Date picker states
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [activeDateField, setActiveDateField] = useState(null);
  
  // Modal states for adding new items
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [showEducationForm, setShowEducationForm] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(-1);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current user profile from the API
      const userData = await userService.getCurrentUser();
      
      if (!userData) {
        setError('Failed to load user profile');
        return;
      }
      
      setProfile(userData);
      
      // Parse skills properly - handle populated skill objects or string arrays
      let parsedSkills = [];
      if (userData.skills) {
        parsedSkills = userData.skills.map(skill => {
          if (typeof skill === 'object' && skill.name) {
            return skill.name;  // If skill is a populated object, get the name
          }
          return skill;  // If skill is already a string
        });
      }
      
      // Parse interests properly based on schema
      let parsedInterests = { topics: [], industries: [] };
      if (userData.interests) {
        if (Array.isArray(userData.interests)) {
          // Old format - convert to new format
          parsedInterests.topics = userData.interests;
        } else if (typeof userData.interests === 'object') {
          // New format
          parsedInterests = {
            topics: userData.interests.topics || [],
            industries: userData.interests.industries || []
          };
        }
      }
      
      // Extract location value properly
      let locationValue = '';
      if (userData.location) {
        if (typeof userData.location === 'object') {
          if (userData.location.name) {
            locationValue = userData.location.name;
          } else if (userData.location.coordinates) {
            locationValue = `${userData.location.coordinates[1]}, ${userData.location.coordinates[0]}`;
          } else {
            locationValue = JSON.stringify(userData.location).replace(/[{}"]/g, '');
          }
        } else {
          locationValue = userData.location.toString();
        }
      }
      
      // Initialize local state with user data
      setLocalProfile({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        headline: userData.headline || '',
        bio: userData.bio || '',
        location: locationValue,
        phone: userData.phone || '',
        website: userData.website || '',
        birthday: userData.birthday ? new Date(userData.birthday) : null,
        gender: userData.gender || '',
        skills: parsedSkills,
        interests: parsedInterests,
        languages: userData.languages || [],
        experience: userData.experience || [],
        education: userData.education || [],
        socialLinks: userData.socialLinks || []
      });
    } catch (error) {
      console.error('Error loading profile:', error.response?.data || error.message);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setLocalProfile(prev => ({ ...prev, [key]: value }));
  };

  // Add/remove skills
  const handleAddSkill = () => {
    if (newSkill.trim() === '') return;
    
    const currentSkills = Array.isArray(localProfile.skills) ? localProfile.skills : [];
    
    if (!currentSkills.includes(newSkill.trim())) {
      setLocalProfile(prev => ({
        ...prev,
        skills: [...currentSkills, newSkill.trim()]
      }));
    }
    
    setNewSkill('');
  };

  const handleRemoveSkill = (skill) => {
    const currentSkills = Array.isArray(localProfile.skills) ? localProfile.skills : [];
    
    setLocalProfile(prev => ({
      ...prev,
      skills: currentSkills.filter(s => s !== skill)
    }));
  };

  // Add/remove interests
  const handleAddInterestTopic = () => {
    if (newInterestTopic.trim() === '') return;
    
    const currentTopics = localProfile.interests?.topics || [];
    
    if (!currentTopics.includes(newInterestTopic.trim())) {
      setLocalProfile(prev => ({
        ...prev,
        interests: {
          ...prev.interests,
          topics: [...currentTopics, newInterestTopic.trim()]
        }
      }));
    }
    
    setNewInterestTopic('');
  };

  const handleRemoveInterestTopic = (topic) => {
    const currentTopics = localProfile.interests?.topics || [];
    
    setLocalProfile(prev => ({
      ...prev,
      interests: {
        ...prev.interests,
        topics: currentTopics.filter(t => t !== topic)
      }
    }));
  };

  // Add/remove languages
  const handleAddLanguage = () => {
    if (newLanguage.language.trim() === '') return;
    
    const currentLanguages = Array.isArray(localProfile.languages) ? localProfile.languages : [];
    
    setLocalProfile(prev => ({
      ...prev,
      languages: [...currentLanguages, { ...newLanguage }]
    }));
    
    setNewLanguage({ language: '', proficiency: 'basic' });
  };

  const handleRemoveLanguage = (index) => {
    const currentLanguages = Array.isArray(localProfile.languages) ? localProfile.languages : [];
    
    setLocalProfile(prev => ({
      ...prev,
      languages: currentLanguages.filter((_, i) => i !== index)
    }));
  };

  // Add/remove social links
  const handleAddSocialLink = () => {
    if (newSocialLink.platform.trim() === '' || newSocialLink.url.trim() === '') return;
    
    const currentSocialLinks = Array.isArray(localProfile.socialLinks) ? localProfile.socialLinks : [];
    
    setLocalProfile(prev => ({
      ...prev,
      socialLinks: [...currentSocialLinks, { ...newSocialLink }]
    }));
    
    setNewSocialLink({ platform: '', url: '' });
  };

  const handleRemoveSocialLink = (index) => {
    const currentSocialLinks = Array.isArray(localProfile.socialLinks) ? localProfile.socialLinks : [];
    
    setLocalProfile(prev => ({
      ...prev,
      socialLinks: currentSocialLinks.filter((_, i) => i !== index)
    }));
  };

  // Handle experience form
  const handleExperienceFormChange = (key, value) => {
    setExperienceForm(prev => ({ ...prev, [key]: value }));
  };

  const handleAddExperience = () => {
    if (experienceForm.company.trim() === '' || experienceForm.position.trim() === '') {
      Alert.alert('Error', 'Company and position are required');
      return;
    }
    
    const currentExperience = Array.isArray(localProfile.experience) ? localProfile.experience : [];
    
    if (editingItemIndex >= 0) {
      // Update existing
      setLocalProfile(prev => ({
        ...prev,
        experience: currentExperience.map((exp, index) => 
          index === editingItemIndex ? { ...experienceForm } : exp
        )
      }));
    } else {
      // Add new
      setLocalProfile(prev => ({
        ...prev,
        experience: [...currentExperience, { ...experienceForm }]
      }));
    }
    
    // Reset form and close modal
    setExperienceForm({
      company: '',
      position: '',
      location: '',
      startDate: null,
      endDate: null,
      current: false,
      description: '',
      skills: []
    });
    setShowExperienceForm(false);
    setEditingItemIndex(-1);
  };

  const handleEditExperience = (index) => {
    setExperienceForm(localProfile.experience[index]);
    setEditingItemIndex(index);
    setShowExperienceForm(true);
  };

  const handleRemoveExperience = (index) => {
    const currentExperience = Array.isArray(localProfile.experience) ? localProfile.experience : [];
    
    setLocalProfile(prev => ({
      ...prev,
      experience: currentExperience.filter((_, i) => i !== index)
    }));
  };

  // Handle education form
  const handleEducationFormChange = (key, value) => {
    setEducationForm(prev => ({ ...prev, [key]: value }));
  };

  const handleAddEducation = () => {
    if (educationForm.institution.trim() === '') {
      Alert.alert('Error', 'Institution is required');
      return;
    }
    
    const currentEducation = Array.isArray(localProfile.education) ? localProfile.education : [];
    
    if (editingItemIndex >= 0) {
      // Update existing
      setLocalProfile(prev => ({
        ...prev,
        education: currentEducation.map((edu, index) => 
          index === editingItemIndex ? { ...educationForm } : edu
        )
      }));
    } else {
      // Add new
      setLocalProfile(prev => ({
        ...prev,
        education: [...currentEducation, { ...educationForm }]
      }));
    }
    
    // Reset form and close modal
    setEducationForm({
      institution: '',
      degree: '',
      field: '',
      startDate: null,
      endDate: null,
      current: false,
      description: ''
    });
    setShowEducationForm(false);
    setEditingItemIndex(-1);
  };

  const handleEditEducation = (index) => {
    setEducationForm(localProfile.education[index]);
    setEditingItemIndex(index);
    setShowEducationForm(true);
  };

  const handleRemoveEducation = (index) => {
    const currentEducation = Array.isArray(localProfile.education) ? localProfile.education : [];
    
    setLocalProfile(prev => ({
      ...prev,
      education: currentEducation.filter((_, i) => i !== index)
    }));
  };

  // Date picker functions
  const showDatePicker = (fieldName) => {
    setActiveDateField(fieldName);
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
    setActiveDateField(null);
  };

  const handleConfirmDate = (date) => {
    hideDatePicker();
    
    if (activeDateField.startsWith('experience.')) {
      // Handling experience dates
      const field = activeDateField.split('.')[1];
      setExperienceForm(prev => ({ ...prev, [field]: date }));
    } else if (activeDateField.startsWith('education.')) {
      // Handling education dates
      const field = activeDateField.split('.')[1];
      setEducationForm(prev => ({ ...prev, [field]: date }));
    } else {
      // Handle other date fields (e.g., birthday)
      setLocalProfile(prev => ({ ...prev, [activeDateField]: date }));
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Image picker
  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access media library is required.');
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImageUpload(result.assets[0]);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Save profile
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Validate required fields
      if (!localProfile.firstName || !localProfile.lastName) {
        setError('First name and last name are required');
        setSaving(false);
        return;
      }
      
      // Send update to server
      await userService.updateProfile(localProfile, imageUpload);
      
      // Update local user context
      if (typeof updateUser === 'function') {
        await updateUser({
          ...currentUser,
          ...localProfile
        });
      }
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Update profile error:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Render section navigation tabs
  const renderSectionTabs = () => {
    const sections = [
      { id: 'basic', label: 'Basic', icon: 'person-outline' },
      { id: 'about', label: 'About', icon: 'information-circle-outline' },
      { id: 'experience', label: 'Experience', icon: 'briefcase-outline' },
      { id: 'education', label: 'Education', icon: 'school-outline' },
      { id: 'skills', label: 'Skills', icon: 'construct-outline' },
      { id: 'contact', label: 'Contact', icon: 'call-outline' }
    ];
    
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer}>
        {sections.map(section => (
          <TouchableOpacity
            key={section.id}
            style={[styles.tabItem, activeSection === section.id && styles.activeTabItem]}
            onPress={() => setActiveSection(section.id)}
          >
            <Ionicons
              name={section.icon}
              size={18}
              color={activeSection === section.id ? '#FF6B00' : '#888'}
            />
            <Text style={[styles.tabLabel, activeSection === section.id && styles.activeTabLabel]}>
              {section.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Render basic information section
  const renderBasicSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>First Name *</Text>
          <TextInput
            style={styles.input}
            value={localProfile.firstName}
            onChangeText={(text) => handleChange('firstName', text)}
            placeholder="Your first name"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Last Name *</Text>
          <TextInput
            style={styles.input}
            value={localProfile.lastName}
            onChangeText={(text) => handleChange('lastName', text)}
            placeholder="Your last name"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Headline</Text>
          <TextInput
            style={styles.input}
            value={localProfile.headline}
            onChangeText={(text) => handleChange('headline', text)}
            placeholder="Software Engineer | Project Manager | Data Scientist"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Gender</Text>
          <TextInput
            style={styles.input}
            value={localProfile.gender}
            onChangeText={(text) => handleChange('gender', text)}
            placeholder="Your gender (optional)"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Birthday</Text>
          <TouchableOpacity 
            style={styles.datePickerButton}
            onPress={() => showDatePicker('birthday')}
          >
            <Text style={styles.datePickerText}>
              {localProfile.birthday ? formatDate(localProfile.birthday) : 'Select birthday (optional)'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render about section
  const renderAboutSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={localProfile.bio}
            onChangeText={(text) => handleChange('bio', text)}
            placeholder="Tell others about yourself, your career journey, and professional interests"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>
        
        <Text style={styles.sectionSubTitle}>Interests</Text>
        <View style={styles.tagsContainer}>
          {localProfile.interests?.topics?.map((topic, index) => (
            <View key={index} style={styles.tagItem}>
              <Text style={styles.tagText}>{topic}</Text>
              <TouchableOpacity 
                style={styles.tagRemoveButton}
                onPress={() => handleRemoveInterestTopic(topic)}
              >
                <Ionicons name="close-circle" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        
        <View style={styles.inputGroup}>
          <View style={styles.addTagContainer}>
            <TextInput
              style={styles.tagInput}
              value={newInterestTopic}
              onChangeText={setNewInterestTopic}
              placeholder="Add an interest"
            />
            <TouchableOpacity 
              style={styles.addTagButton}
              onPress={handleAddInterestTopic}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render experience section
  const renderExperienceSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionSubTitle}>Work Experience</Text>
          <TouchableOpacity 
            style={styles.addItemButton}
            onPress={() => {
              setExperienceForm({
                company: '',
                position: '',
                location: '',
                startDate: null,
                endDate: null,
                current: false,
                description: '',
                skills: []
              });
              setEditingItemIndex(-1);
              setShowExperienceForm(true);
            }}
          >
            <Ionicons name="add-circle" size={24} color="#FF6B00" />
          </TouchableOpacity>
        </View>
        
        {localProfile.experience && localProfile.experience.length > 0 ? (
          localProfile.experience.map((exp, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{exp.position}</Text>
                <View style={styles.itemActions}>
                  <TouchableOpacity 
                    style={styles.itemActionButton}
                    onPress={() => handleEditExperience(index)}
                  >
                    <Ionicons name="create-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.itemActionButton}
                    onPress={() => handleRemoveExperience(index)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.itemSubtitle}>{exp.company}</Text>
              {exp.location && <Text style={styles.itemDetail}>{exp.location}</Text>}
              <Text style={styles.itemDuration}>
                {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
              </Text>
              {exp.description && <Text style={styles.itemDescription}>{exp.description}</Text>}
            </View>
          ))
        ) : (
          <Text style={styles.emptyStateText}>No work experience added yet</Text>
        )}
        
        {/* Experience form modal */}
        {showExperienceForm && (
          <View style={styles.formModal}>
            <View style={styles.formModalContent}>
              <View style={styles.formModalHeader}>
                <Text style={styles.formModalTitle}>
                  {editingItemIndex >= 0 ? 'Edit Experience' : 'Add Experience'}
                </Text>
                <TouchableOpacity
                  style={styles.formModalCloseButton}
                  onPress={() => setShowExperienceForm(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.formModalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Company *</Text>
                  <TextInput
                    style={styles.input}
                    value={experienceForm.company}
                    onChangeText={(text) => handleExperienceFormChange('company', text)}
                    placeholder="Company name"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Position *</Text>
                  <TextInput
                    style={styles.input}
                    value={experienceForm.position}
                    onChangeText={(text) => handleExperienceFormChange('position', text)}
                    placeholder="Your job title"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={experienceForm.location}
                    onChangeText={(text) => handleExperienceFormChange('location', text)}
                    placeholder="City, Country"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => showDatePicker('experience.startDate')}
                  >
                    <Text style={styles.datePickerText}>
                      {experienceForm.startDate ? formatDate(experienceForm.startDate) : 'Select start date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.checkboxRow}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => handleExperienceFormChange('current', !experienceForm.current)}
                  >
                    {experienceForm.current ? (
                      <Ionicons name="checkbox" size={24} color="#FF6B00" />
                    ) : (
                      <Ionicons name="square-outline" size={24} color="#666" />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>I currently work here</Text>
                </View>
                
                {!experienceForm.current && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>End Date</Text>
                    <TouchableOpacity 
                      style={styles.datePickerButton}
                      onPress={() => showDatePicker('experience.endDate')}
                    >
                      <Text style={styles.datePickerText}>
                        {experienceForm.endDate ? formatDate(experienceForm.endDate) : 'Select end date'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={experienceForm.description}
                    onChangeText={(text) => handleExperienceFormChange('description', text)}
                    placeholder="Describe your responsibilities and achievements"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>
              
              <View style={styles.formModalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowExperienceForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveModalButton}
                  onPress={handleAddExperience}
                >
                  <Text style={styles.saveModalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render education section
  const renderEducationSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionSubTitle}>Education</Text>
          <TouchableOpacity 
            style={styles.addItemButton}
            onPress={() => {
              setEducationForm({
                institution: '',
                degree: '',
                field: '',
                startDate: null,
                endDate: null,
                current: false,
                description: ''
              });
              setEditingItemIndex(-1);
              setShowEducationForm(true);
            }}
          >
            <Ionicons name="add-circle" size={24} color="#FF6B00" />
          </TouchableOpacity>
        </View>
        
        {localProfile.education && localProfile.education.length > 0 ? (
          localProfile.education.map((edu, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{edu.institution}</Text>
                <View style={styles.itemActions}>
                  <TouchableOpacity 
                    style={styles.itemActionButton}
                    onPress={() => handleEditEducation(index)}
                  >
                    <Ionicons name="create-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.itemActionButton}
                    onPress={() => handleRemoveEducation(index)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
              {edu.degree && <Text style={styles.itemSubtitle}>{edu.degree}</Text>}
              {edu.field && <Text style={styles.itemDetail}>{edu.field}</Text>}
              <Text style={styles.itemDuration}>
              {formatDate(edu.startDate)} - {edu.current ? 'Present' : formatDate(edu.endDate)}
              </Text>
              {edu.description && <Text style={styles.itemDescription}>{edu.description}</Text>}
            </View>
          ))
        ) : (
          <Text style={styles.emptyStateText}>No education added yet</Text>
        )}
        
        {/* Education form modal */}
        {showEducationForm && (
          <View style={styles.formModal}>
            <View style={styles.formModalContent}>
              <View style={styles.formModalHeader}>
                <Text style={styles.formModalTitle}>
                  {editingItemIndex >= 0 ? 'Edit Education' : 'Add Education'}
                </Text>
                <TouchableOpacity
                  style={styles.formModalCloseButton}
                  onPress={() => setShowEducationForm(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.formModalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Institution *</Text>
                  <TextInput
                    style={styles.input}
                    value={educationForm.institution}
                    onChangeText={(text) => handleEducationFormChange('institution', text)}
                    placeholder="School or university name"
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Degree</Text>
                  <TextInput
                    style={styles.input}
                    value={educationForm.degree}
                    onChangeText={(text) => handleEducationFormChange('degree', text)}
                    placeholder="Bachelor's, Master's, PhD, etc."
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Field of Study</Text>
                  <TextInput
                    style={styles.input}
                    value={educationForm.field}
                    onChangeText={(text) => handleEducationFormChange('field', text)}
                    placeholder="Computer Science, Business, etc."
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TouchableOpacity 
                    style={styles.datePickerButton}
                    onPress={() => showDatePicker('education.startDate')}
                  >
                    <Text style={styles.datePickerText}>
                      {educationForm.startDate ? formatDate(educationForm.startDate) : 'Select start date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.checkboxRow}>
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => handleEducationFormChange('current', !educationForm.current)}
                  >
                    {educationForm.current ? (
                      <Ionicons name="checkbox" size={24} color="#FF6B00" />
                    ) : (
                      <Ionicons name="square-outline" size={24} color="#666" />
                    )}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>I'm currently studying here</Text>
                </View>
                
                {!educationForm.current && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>End Date</Text>
                    <TouchableOpacity 
                      style={styles.datePickerButton}
                      onPress={() => showDatePicker('education.endDate')}
                    >
                      <Text style={styles.datePickerText}>
                        {educationForm.endDate ? formatDate(educationForm.endDate) : 'Select end date'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={educationForm.description}
                    onChangeText={(text) => handleEducationFormChange('description', text)}
                    placeholder="Additional information about your education"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>
              
              <View style={styles.formModalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowEducationForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveModalButton}
                  onPress={handleAddEducation}
                >
                  <Text style={styles.saveModalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Render skills section
  const renderSkillsSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionSubTitle}>Skills</Text>
        </View>
        
        <View style={styles.tagsContainer}>
          {Array.isArray(localProfile.skills) ? (
            localProfile.skills.map((skill, index) => (
              <View key={index} style={styles.tagItem}>
                <Text style={styles.tagText}>{skill}</Text>
                <TouchableOpacity 
                  style={styles.tagRemoveButton}
                  onPress={() => handleRemoveSkill(skill)}
                >
                  <Ionicons name="close-circle" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))
          ) : null}
        </View>
        
        <View style={styles.inputGroup}>
          <View style={styles.addTagContainer}>
            <TextInput
              style={styles.tagInput}
              value={newSkill}
              onChangeText={setNewSkill}
              placeholder="Add a skill"
            />
            <TouchableOpacity 
              style={styles.addTagButton}
              onPress={handleAddSkill}
            >
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionSubTitle}>Languages</Text>
        </View>
        
        {localProfile.languages && localProfile.languages.length > 0 ? (
          localProfile.languages.map((lang, index) => (
            <View key={index} style={styles.languageItem}>
              <View style={styles.languageHeader}>
                <Text style={styles.languageName}>{lang.language}</Text>
                <TouchableOpacity 
                  style={styles.itemActionButton}
                  onPress={() => handleRemoveLanguage(index)}
                >
                  <Ionicons name="trash-outline" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.proficiencySelector}>
                <Text style={styles.proficiencyLabel}>Proficiency:</Text>
                <View style={styles.proficiencyOptions}>
                  {['basic', 'conversational', 'fluent', 'native'].map(level => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.proficiencyOption,
                        lang.proficiency === level && styles.selectedProficiencyOption
                      ]}
                      onPress={() => {
                        const updatedLanguages = [...localProfile.languages];
                        updatedLanguages[index].proficiency = level;
                        setLocalProfile(prev => ({...prev, languages: updatedLanguages}));
                      }}
                    >
                      <Text
                        style={[
                          styles.proficiencyOptionText,
                          lang.proficiency === level && styles.selectedProficiencyOptionText
                        ]}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyStateText}>No languages added yet</Text>
        )}
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Add Language</Text>
          <TextInput
            style={styles.input}
            value={newLanguage.language}
            onChangeText={(text) => setNewLanguage(prev => ({...prev, language: text}))}
            placeholder="Language name"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Proficiency Level</Text>
          <View style={styles.proficiencyOptions}>
            {['basic', 'conversational', 'fluent', 'native'].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.proficiencyOption,
                  newLanguage.proficiency === level && styles.selectedProficiencyOption
                ]}
                onPress={() => setNewLanguage(prev => ({...prev, proficiency: level}))}
              >
                <Text
                  style={[
                    styles.proficiencyOptionText,
                    newLanguage.proficiency === level && styles.selectedProficiencyOptionText
                  ]}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddLanguage}
        >
          <Text style={styles.addButtonText}>Add Language</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render contact section
  const renderContactSection = () => {
    return (
      <View style={styles.section}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Location</Text>
          <TextInput
            style={styles.input}
            value={localProfile.location}
            onChangeText={(text) => handleChange('location', text)}
            placeholder="City, Country"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            value={localProfile.phone}
            onChangeText={(text) => handleChange('phone', text)}
            placeholder="Your phone number"
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Website</Text>
          <TextInput
            style={styles.input}
            value={localProfile.website}
            onChangeText={(text) => handleChange('website', text)}
            placeholder="Your website or portfolio URL"
            keyboardType="url"
          />
        </View>
        
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionSubTitle}>Social Links</Text>
        </View>
        
        {localProfile.socialLinks && localProfile.socialLinks.length > 0 ? (
          localProfile.socialLinks.map((link, index) => (
            <View key={index} style={styles.socialLinkItem}>
              <View style={styles.socialLinkIcon}>
                <Ionicons name={getSocialIcon(link.platform)} size={24} color="#FF6B00" />
              </View>
              <View style={styles.socialLinkContent}>
                <Text style={styles.socialLinkPlatform}>{link.platform}</Text>
                <Text style={styles.socialLinkUrl} numberOfLines={1}>{link.url}</Text>
              </View>
              <TouchableOpacity 
                style={styles.itemActionButton}
                onPress={() => handleRemoveSocialLink(index)}
              >
                <Ionicons name="trash-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyStateText}>No social links added yet</Text>
        )}
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Platform</Text>
          <TextInput
            style={styles.input}
            value={newSocialLink.platform}
            onChangeText={(text) => setNewSocialLink(prev => ({...prev, platform: text}))}
            placeholder="LinkedIn, Twitter, GitHub, etc."
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>URL</Text>
          <TextInput
            style={styles.input}
            value={newSocialLink.url}
            onChangeText={(text) => setNewSocialLink(prev => ({...prev, url: text}))}
            placeholder="https://..."
            keyboardType="url"
          />
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddSocialLink}
        >
          <Text style={styles.addButtonText}>Add Social Link</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Helper function to get social media icon names
  const getSocialIcon = (platform) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('facebook')) return 'logo-facebook';
    if (platformLower.includes('twitter') || platformLower.includes('x')) return 'logo-twitter';
    if (platformLower.includes('instagram')) return 'logo-instagram';
    if (platformLower.includes('linkedin')) return 'logo-linkedin';
    if (platformLower.includes('github')) return 'logo-github';
    if (platformLower.includes('youtube')) return 'logo-youtube';
    if (platformLower.includes('tiktok')) return 'logo-tiktok';
    return 'globe-outline';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={styles.keyboardAvoidView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
            {saving ? (
              <ActivityIndicator size="small" color="#FF6B00" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Image */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageContainer}>
            {imageUpload ? (
              <Image source={{ uri: imageUpload.uri }} style={styles.profileImage} />
            ) : profile?.profileImage ? (
              <Image source={{ uri: profile.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>
                  {localProfile.firstName ? localProfile.firstName.charAt(0) : ''}
                  {localProfile.lastName ? localProfile.lastName.charAt(0) : ''}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editImageButton} onPress={handleImagePick}>
              <Ionicons name="camera" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Section tabs */}
        {renderSectionTabs()}
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Section content */}
          {activeSection === 'basic' && renderBasicSection()}
          {activeSection === 'about' && renderAboutSection()}
          {activeSection === 'experience' && renderExperienceSection()}
          {activeSection === 'education' && renderEducationSection()}
          {activeSection === 'skills' && renderSkillsSection()}
          {activeSection === 'contact' && renderContactSection()}
          
          {/* Save Button at the bottom */}
          <TouchableOpacity 
            style={styles.bottomSaveButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.bottomSaveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
      />
    </SafeAreaView>
  );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base width used for scaling (can be adjusted based on your design)
const baseWidth = 375; // Standard iPhone width

// Scaling factor for responsive sizing
const scale = SCREEN_WIDTH / baseWidth;

// Normalize font size based on screen width
const normalize = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

// Responsive spacing units
const spacing = {
  xs: 5 * scale,
  sm: 10 * scale,
  md: 15 * scale,
  lg: 20 * scale,
  xl: 30 * scale
};

// Responsive typography
const typography = {
  small: normalize(12),
  body: normalize(14),
  subtitle: normalize(16),
  title: normalize(18),
  header: normalize(20),
  large: normalize(24),
};

// Responsive styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
  },
  errorText: {
    fontSize: typography.body,
    color: '#FF6B00',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: typography.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: spacing.xs,
  },
  saveButtonText: {
    color: '#FF6B00',
    fontWeight: 'bold',
    fontSize: typography.subtitle,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  profileImageSection: {
    alignItems: 'center',
    padding: spacing.md,
  },
  profileImageContainer: {
    width: SCREEN_WIDTH * 0.3, // 30% of screen width
    height: SCREEN_WIDTH * 0.3, // Keep aspect ratio
    borderRadius: SCREEN_WIDTH * 0.15, // Half of width for circle
    overflow: 'hidden',
    position: 'relative',
    maxWidth: 150, // Set max size
    maxHeight: 150,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImagePlaceholderText: {
    fontSize: normalize(SCREEN_WIDTH * 0.08), // Dynamic font size based on screen width
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B00',
    width: SCREEN_WIDTH * 0.09, // Proportional to screen
    height: SCREEN_WIDTH * 0.09,
    borderRadius: SCREEN_WIDTH * 0.045,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    minWidth: 28, // Minimum touchable size
    minHeight: 28,
  },
  
  // Tab navigation
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: spacing.sm,
    flexWrap: 'wrap', // Allow wrapping on small screens
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: 2, // For wrapped items
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B00',
  },
  tabLabel: {
    fontSize: typography.small,
    color: '#888',
    marginLeft: spacing.xs,
  },
  activeTabLabel: {
    color: '#FF6B00',
    fontWeight: 'bold',
  },
  
  // Section styles
  section: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionSubTitle: {
    fontSize: typography.subtitle,
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: '#333',
  },
  
  // Form elements
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.small,
    marginBottom: spacing.xs,
    color: '#666',
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: spacing.sm,
    borderRadius: 8,
    fontSize: typography.body,
    minHeight: 45, // Minimum height for touch target
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  // Date picker
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: spacing.sm,
    borderRadius: 8,
    minHeight: 45,
  },
  datePickerText: {
    fontSize: typography.body,
    color: '#333',
  },
  
  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap', // Allow wrapping on small screens
  },
  checkbox: {
    marginRight: spacing.sm,
  },
  checkboxLabel: {
    fontSize: typography.body,
    color: '#333',
    flexShrink: 1, // Allow text to shrink
  },
  
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagText: {
    fontSize: typography.small,
    marginRight: spacing.xs,
  },
  tagRemoveButton: {
    padding: 2,
    minWidth: 20, // Minimum touchable size
    minHeight: 20,
  },
  
  // Tag input
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Allow wrapping on small screens
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: spacing.sm,
    borderRadius: 8,
    fontSize: typography.body,
    marginRight: spacing.sm,
    marginBottom: SCREEN_WIDTH < 340 ? spacing.sm : 0, // Add bottom margin on very small screens
    minHeight: 45,
  },
  addTagButton: {
    backgroundColor: '#FF6B00',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Item card
  itemCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexWrap: 'wrap', // Allow wrapping on small screens
  },
  itemTitle: {
    fontSize: typography.subtitle,
    fontWeight: 'bold',
    color: '#333',
    flex: 1, // Take available space
  },
  itemActions: {
    flexDirection: 'row',
  },
  itemActionButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
    minWidth: 30, // Minimum touchable size
    minHeight: 30,
  },
  itemSubtitle: {
    fontSize: typography.body,
    color: '#444',
    marginBottom: spacing.xs,
  },
  itemDetail: {
    fontSize: typography.small,
    color: '#666',
    marginBottom: spacing.xs,
  },
  itemDuration: {
    fontSize: typography.small,
    color: '#888',
    marginBottom: spacing.xs,
  },
  itemDescription: {
    fontSize: typography.small,
    color: '#666',
    lineHeight: typography.body * 1.4,
  },
  
  // Modal
  formModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  formModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  formModalTitle: {
    fontSize: typography.title,
    fontWeight: 'bold',
  },
  formModalCloseButton: {
    padding: spacing.xs,
    minWidth: 30, // Minimum touchable size
    minHeight: 30,
  },
  formModalBody: {
    padding: spacing.md,
    maxHeight: '70%',
  },
  formModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexWrap: 'wrap', // Allow buttons to wrap on small screens
  },
  
  // Buttons
  cancelButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    minHeight: 44, // Minimum touchable size
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: typography.subtitle,
  },
  saveModalButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    minHeight: 44, // Minimum touchable size
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveModalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: typography.subtitle,
  },
  
  // Empty state
  emptyStateText: {
    color: '#999',
    fontSize: typography.body,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  
  // Language selector
  languageItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  languageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    flexWrap: 'wrap', // Allow wrapping on small screens
  },
  languageName: {
    fontSize: typography.subtitle,
    fontWeight: 'bold',
    color: '#333',
  },
  proficiencySelector: {
    marginTop: spacing.xs,
  },
  proficiencyLabel: {
    fontSize: typography.small,
    color: '#666',
    marginBottom: spacing.xs,
  },
  proficiencyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  proficiencyOption: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 16,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: '#F0F0F0',
    minHeight: 32, // Minimum touchable size
  },
  selectedProficiencyOption: {
    backgroundColor: '#FFF5EF',
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  proficiencyOptionText: {
    fontSize: typography.small,
    color: '#666',
  },
  selectedProficiencyOptionText: {
    color: '#FF6B00',
    fontWeight: '500',
  },
  
  // Add button
  addButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    minHeight: 44, // Minimum touchable size
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: typography.body,
  },
  
  // Social links
  socialLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  socialLinkIcon: {
    width: SCREEN_WIDTH * 0.1,
    height: SCREEN_WIDTH * 0.1,
    borderRadius: SCREEN_WIDTH * 0.05,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    minWidth: 36, // Minimum size
    minHeight: 36,
  },
  socialLinkContent: {
    flex: 1,
  },
  socialLinkPlatform: {
    fontSize: typography.subtitle,
    fontWeight: 'bold',
    color: '#333',
  },
  socialLinkUrl: {
    fontSize: typography.small,
    color: '#666',
  },
  
  // Bottom save button
  bottomSaveButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    margin: spacing.md,
    alignItems: 'center',
    minHeight: 48, // Minimum touchable size
  },
  bottomSaveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: typography.subtitle,
  },
  
  // Responsive adaptations for different screen sizes
  ...(SCREEN_WIDTH < 360 ? {
    // Styles for very small screens
    profileImageContainer: {
      width: SCREEN_WIDTH * 0.25,
      height: SCREEN_WIDTH * 0.25,
      borderRadius: SCREEN_WIDTH * 0.125,
    },
    tabLabel: {
      fontSize: typography.small - 1,
    },
  } : {}),
  
  ...(SCREEN_WIDTH > 600 ? {
    // Styles for larger screens (tablets)
    profileImageContainer: {
      maxWidth: 180,
      maxHeight: 180,
    },
    section: {
      padding: spacing.lg,
    },
    input: {
      padding: spacing.md,
    },
  } : {})
});

export default EditProfileScreen;
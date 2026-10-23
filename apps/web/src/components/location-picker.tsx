'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, ChevronDown, X, Search, Check } from 'lucide-react';
import {
  vietnamLocations,
  popularProvinces,
  normalizeVietnamese,
  type Province,
  type District
} from '../lib/vietnam-locations';

interface LocationPickerProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  'aria-label'?: string;
  disabled?: boolean;
}

export function LocationPicker({
  value,
  placeholder = 'Phường/xã, quận/huyện, tỉnh/thành',
  onChange,
  'aria-label': ariaLabel,
  disabled
}: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'province' | 'district' | 'ward'>('province');
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Focus search input on open
  useEffect(() => {
    if (open) {
      // If province is already selected, start from district or ward
      if (selectedProvince && !selectedDistrict) {
        setActiveTab('district');
      } else if (selectedProvince && selectedDistrict) {
        setActiveTab('ward');
      } else {
        setActiveTab('province');
      }
    } else {
      setSearchQuery('');
    }
  }, [open]);

  const handleSelectProvince = (prov: Province) => {
    setSelectedProvince(prov);
    setSelectedDistrict(null);
    setActiveTab('district');
  };

  const handleSelectDistrict = (dist: District) => {
    setSelectedDistrict(dist);
    setActiveTab('ward');
  };

  const handleSelectWard = (ward: string) => {
    if (!selectedProvince) return;
    const districtPart = selectedDistrict ? `${selectedDistrict.name}, ` : '';
    const fullAddress = `${ward}, ${districtPart}${selectedProvince.name}`;
    onChange(fullAddress);
    setOpen(false);
  };

  const handleSelectOnlyProvince = (provName: string) => {
    onChange(provName);
    setOpen(false);
  };

  const handleSelectOnlyDistrict = () => {
    if (!selectedProvince || !selectedDistrict) return;
    onChange(`${selectedDistrict.name}, ${selectedProvince.name}`);
    setOpen(false);
  };

  // Instant search results across provinces, districts, and wards
  const searchResults = useMemo(() => {
    const q = normalizeVietnamese(searchQuery.trim());
    if (!q || q.length < 2) return [];

    const results: { label: string; full: string; type: string }[] = [];

    for (const prov of vietnamLocations) {
      const normProv = normalizeVietnamese(prov.name);
      if (normProv.includes(q)) {
        results.push({
          label: prov.name,
          full: prov.name,
          type: 'Tỉnh / Thành phố'
        });
      }

      for (const dist of prov.districts) {
        const normDist = normalizeVietnamese(dist.name);
        if (normDist.includes(q)) {
          results.push({
            label: `${dist.name}, ${prov.name}`,
            full: `${dist.name}, ${prov.name}`,
            type: 'Quận / Huyện'
          });
        }

        for (const ward of dist.wards) {
          const normWard = normalizeVietnamese(ward);
          if (normWard.includes(q)) {
            results.push({
              label: `${ward}, ${dist.name}, ${prov.name}`,
              full: `${ward}, ${dist.name}, ${prov.name}`,
              type: 'Phường / Xã'
            });
            if (results.length >= 25) return results;
          }
        }
        if (results.length >= 25) return results;
      }
    }
    return results;
  }, [searchQuery]);

  return (
    <div className="location-picker-wrap" ref={containerRef}>
      <div className="location-input-box" onClick={() => !disabled && setOpen(true)}>
        <MapPin size={17} className="location-pin-icon" />
        <input
          type="text"
          value={value}
          placeholder={placeholder}
          aria-label={ariaLabel}
          disabled={disabled}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          onFocus={() => !disabled && setOpen(true)}
          className="location-text-input"
        />
        {value && !disabled ? (
          <button
            type="button"
            className="location-clear-btn"
            title="Xóa địa điểm"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              setSelectedProvince(null);
              setSelectedDistrict(null);
            }}
          >
            <X size={15} />
          </button>
        ) : (
          <ChevronDown size={16} className={`location-arrow-icon ${open ? 'open' : ''}`} />
        )}
      </div>

      {open && (
        <div className="location-popover" role="dialog" aria-modal="false">
          <div className="location-popover-header">
            <div className="location-search-box">
              <Search size={15} className="location-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm nhanh tỉnh, huyện, phường/xã..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="location-search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="location-search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="location-close-btn"
              onClick={() => setOpen(false)}
              title="Đóng"
            >
              <X size={17} />
            </button>
          </div>

          {searchQuery.trim().length >= 2 ? (
            <div className="location-search-results">
              {searchResults.length === 0 ? (
                <div className="location-empty">Không tìm thấy địa điểm phù hợp</div>
              ) : (
                searchResults.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    className="location-search-item"
                    onClick={() => {
                      onChange(item.full);
                      setOpen(false);
                    }}
                  >
                    <span className="location-item-badge">{item.type}</span>
                    <strong className="location-item-label">{item.label}</strong>
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              <div className="location-tabs">
                <button
                  type="button"
                  className={`location-tab ${activeTab === 'province' ? 'active' : ''}`}
                  onClick={() => setActiveTab('province')}
                >
                  {selectedProvince ? selectedProvince.name : '1. Tỉnh / Thành'}
                </button>
                <button
                  type="button"
                  className={`location-tab ${activeTab === 'district' ? 'active' : ''}`}
                  disabled={!selectedProvince}
                  onClick={() => selectedProvince && setActiveTab('district')}
                >
                  {selectedDistrict ? selectedDistrict.name : '2. Quận / Huyện'}
                </button>
                <button
                  type="button"
                  className={`location-tab ${activeTab === 'ward' ? 'active' : ''}`}
                  disabled={!selectedDistrict}
                  onClick={() => selectedDistrict && setActiveTab('ward')}
                >
                  3. Phường / Xã
                </button>
              </div>

              <div className="location-body">
                {activeTab === 'province' && (
                  <div className="location-section">
                    <div className="location-group-title">Tỉnh / Thành phổ biến</div>
                    <div className="location-chip-grid">
                      {popularProvinces.map((name) => {
                        const prov = vietnamLocations.find((p) => p.name === name);
                        if (!prov) return null;
                        const isSelected = selectedProvince?.name === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            className={`location-chip ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectProvince(prov)}
                          >
                            {name}
                            {isSelected && <Check size={13} />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="location-group-title">Tất cả tỉnh / thành phố</div>
                    <div className="location-item-list">
                      {vietnamLocations.map((prov) => {
                        const isSelected = selectedProvince?.name === prov.name;
                        return (
                          <button
                            key={prov.name}
                            type="button"
                            className={`location-list-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectProvince(prov)}
                          >
                            <span>{prov.name}</span>
                            <span className="location-count-badge">
                              {prov.districts.length} quận/huyện
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'district' && selectedProvince && (
                  <div className="location-section">
                    <div className="location-action-bar">
                      <button
                        type="button"
                        className="location-select-parent-btn"
                        onClick={() => handleSelectOnlyProvince(selectedProvince.name)}
                      >
                        <Check size={14} /> Chọn toàn bộ {selectedProvince.name}
                      </button>
                    </div>

                    <div className="location-group-title">
                      Quận / Huyện thuộc {selectedProvince.name}
                    </div>
                    <div className="location-item-list">
                      {selectedProvince.districts.map((dist) => {
                        const isSelected = selectedDistrict?.name === dist.name;
                        return (
                          <button
                            key={dist.name}
                            type="button"
                            className={`location-list-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleSelectDistrict(dist)}
                          >
                            <span>{dist.name}</span>
                            <span className="location-count-badge">
                              {dist.wards.length} phường/xã
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'ward' && selectedProvince && selectedDistrict && (
                  <div className="location-section">
                    <div className="location-action-bar">
                      <button
                        type="button"
                        className="location-select-parent-btn"
                        onClick={handleSelectOnlyDistrict}
                      >
                        <Check size={14} /> Chọn {selectedDistrict.name}, {selectedProvince.name}
                      </button>
                    </div>

                    <div className="location-group-title">
                      Phường / Xã thuộc {selectedDistrict.name}
                    </div>
                    <div className="location-item-list">
                      {selectedDistrict.wards.map((ward) => (
                        <button
                          key={ward}
                          type="button"
                          className="location-list-btn"
                          onClick={() => handleSelectWard(ward)}
                        >
                          <span>{ward}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}


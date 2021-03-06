import { useState, useEffect, useContext, useCallback } from 'react';
import styles from './BoosterSelectionModal.less';
import '../../../node_modules/animate.css/animate.min.css';
import React from 'react';
import { StorageContext } from "../../hooks";
import { WalletContext } from '../../wallet/Wallet';
import axios from 'axios';
import { axioGet } from '../../utils/cache';
import { useLanguage } from '../../hooks/language';


export default function BoosterSelectionModal(props) {
  // Open Confirm Modal //
  const closeModal = () => {
    props.setModal(0);
  }
  const [modal, setModal] = useState(0);
  const t = useLanguage();


  const storage = useContext(StorageContext);

  const wallet = useContext(WalletContext);
  const chainId = wallet.networkId;
  const connected = wallet.connected;
  const address = wallet.address;
  const web3 = wallet.web3;

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  const nftCards = storage.nftCards;
  const nftBalance = storage.nftBalance;
  const setNftId = props.setNftId;


  useEffect(() => {
    const func = async () => {
      setLoading(true);
      const arr = nftCards.map(v => {
        return axioGet(v.uri);
      });

      let rets;
      try {
        rets = await Promise.all(arr);
      } catch (error) {
        console.error('axio error', error);
      }

      let objs = rets.map(v => v.data);

      setCards(objs.map((v, i) => {
        v.tokenId = nftCards[i].tokenId;
        v.boost = nftCards[i].boost;
        v.reduce = nftCards[i].reduce;
        return v;
      }))
      setLoading(false);
    }

    func();
  }, [chainId, address, nftCards, nftBalance]);

  // console.debug('cards222', cards);
  const [sortType, setSortType] = useState('');
  const [search, setSearch] = useState('');

  const onSort = useCallback((a, b) => {
    if (sortType === 'boost') {
      return b.boost - a.boost;
    }
    return 0;
  }, [sortType]);

  const onFilter = useCallback((v) => {
    if (search && search.length > 0) {
      return v.name.toLowerCase().includes(search.toLowerCase());
    }

    return true;
  }, [search]);

  return (
    <React.Fragment>

      <div className={`modal  ${props.isActived === 0 ? "" : "is-active"}`}>
        <div className="modal-background" onClick={closeModal}></div>
        <div style={{ maxWidth: 600 }} className="modal-card animate__animated  animate__fadeInUp animate__faster">
          <section className="modal-card-body">
            <a onClick={closeModal} className="close"><img src="assets/remove16x16.png" /></a>
            <div className={styles.filter_panel}>
              <div className={styles.title}>
                {t("Sort by")}
              </div>
              <div className={styles.sort_btn}>
                <a className={sortType === 'boost' && styles.is_acitve} onClick={() => {
                  setSortType(sortType === 'boost' ? '' : 'boost');
                }}>
                  <div className={styles.icon}>
                    <div>9</div><div>1</div>
                  </div>
                  {t("Boost Reward")}
                </a>
              </div>
              <div className={styles.search}>
                <div>
                  <img src="assets/magnify24x24.png" />
                  <input type="value" placeholder="Input Boosting Name" value={search} onChange={(e) => {
                    setSearch(e.target.value);
                  }}></input>
                </div>
              </div>
            </div>
            <div className={styles.booster_panel}>
              <div className={styles.booster_table}>
                {
                  // loading && "Loading..."
                }

                {
                  cards.filter(onFilter).sort(onSort).map(v => {
                    return <div className={styles.booster_row}>
                      <div className={`${styles.booster_col} ${styles.star}`}>
                        <div className={styles.booster_subcol}>
                          {
                            Number(v.attributes[1].value) < 4 && Array.from({ length: Number(v.attributes[1].value) }).map(v => {
                              return <img src="assets/star18x18.png" />
                            })
                          }
                          {
                            Number(v.attributes[1].value) === 4 && <img src="assets/max.png" />
                          }
                        </div>
                      </div>
                      <div className={`${styles.booster_col} ${styles.title}`}>
                        <div className={styles.booster_subcol}>
                          <img src={v.image} /> <div>{v.name}</div>
                        </div>
                      </div>
                      <div className={`${styles.booster_col} ${styles.stat_action}`}>
                        <div className={styles.booster_subcol}>
                          <div className={styles.stat}><span><img src="assets/rocket24x24.png" />+{(v.boost * 100).toFixed(2)}%</span></div>
                          <div className={styles.stat}><span><img src="assets/hourglass24x24.png" style={{ width: 20 }} />-{(v.reduce * 100).toFixed(2)}%</span></div>
                          <a onClick={() => {
                            setNftId(v.tokenId);
                            props.setIcon(v.image);
                            props.setBoost(v.boost);
                            props.setReduce(v.reduce);
                            closeModal();
                          }}>{t("Attach")}</a>
                        </div>
                      </div>
                    </div>
                  })
                }
              </div>
            </div>
          </section>
        </div>



      </div>
    </React.Fragment>
  )
}

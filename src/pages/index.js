import styles from './index.less';

import { notification, Switch } from 'antd';
import { useState, useEffect, useContext, useCallback } from 'react';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSortAlphaDown,faSortAmountUp,faSortNumericDown,faSortNumericUp } from '@fortawesome/free-solid-svg-icons';

import Pool from '../components/zoo/Pool';
import Loader from '../components/loader'
import { StorageContext } from '../hooks';
import { useLocalStorageState } from 'ahooks';

export default function () {
  const [txWaiting, setTxWaiting] = useState(false);

  // openNotification();
  // openNotification2();
  // openNotification3();
  // openNotification4();

  function toggleFilter() {
    document.getElementById('toggle_filter').classList.toggle("toggled");
    document.getElementById('filter1').classList.toggle("toggled");
    //document.getElementById('filter2').classList.toggle("toggled");
    document.getElementById('filterbar_backdrop').classList.toggle("toggled");

  }

  const storage = useContext(StorageContext);

  const [onlyStaked, setOnlyStaked] = useLocalStorageState('onlyStaked', false);
  const [onlyActived, setOnlyActived] = useLocalStorageState('onlyActived', false);
  const [liquiditySort, setLiquiditySort] = useLocalStorageState('liquiditySort', false);
  const [multiplierSort, setMultiplierSort] = useLocalStorageState('multiplierSort', false);

  const sortFunc = useCallback((a, b)=>{
    if (!liquiditySort && !multiplierSort) {
      return a.pid - b.pid;
    }

    if (multiplierSort) {
      return b.allocPoint - a.allocPoint;
    }

    if (liquiditySort) {
      return Number(b.totalDeposited) - Number(a.totalDeposited);
    }
    return b.pid - a.pid;
  }, [liquiditySort, multiplierSort]);

  return (
    <React.Fragment>
      {
        txWaiting && <Loader/>
      }
      <div id="filterbar_backdrop" onClick={toggleFilter}></div>
      <a id="toggle_filter" className={styles.toggle_filter} onClick={toggleFilter}><span><img src="assets/magnify24x24.png" /> FILTER</span></a>
      <div className={styles.filter_row}>

        <div id="filter1" className={styles.box}>

          <div className={styles.sorting}>
            <div className={styles.title}>
              Sort by
            </div>
            <div className={styles.sort_btn}>
              <a className={styles.is_acitve}>
                <div className={styles.icon}>
                  <FontAwesomeIcon icon={faSortAlphaDown} />
                </div>
              Name
            </a>
              <a>
                <div className={styles.icon}>
                <FontAwesomeIcon icon={faSortNumericDown} />
                </div>
              APY
            </a>
              <a className={ liquiditySort && styles.is_acitve} onClick={()=>{
                setLiquiditySort(!liquiditySort);
                setMultiplierSort(false);
              }}>
                <div className={styles.icon}>
                <FontAwesomeIcon icon={faSortNumericDown} />
                </div>
              Liquidity
              </a>
              <a className={ multiplierSort && styles.is_acitve} onClick={()=>{
                setMultiplierSort(!multiplierSort);
                setLiquiditySort(false);
              }}>
                <div className={styles.icon}>
                <FontAwesomeIcon icon={faSortNumericDown} />
                </div>
              Multiplier
              </a>
            </div>
          </div>
          <div className={styles.view_selection}>
            <div className={styles.title}>
              View only
              </div>
            <div className={styles.view_btn}>
              <a className={ onlyStaked && styles.is_acitve} onClick={()=>{setOnlyStaked(!onlyStaked)}}>Staked</a>
              <a className={ onlyActived && styles.is_acitve} onClick={()=>{setOnlyActived(!onlyActived)}}>Active</a>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.row}>
        {
          storage.poolInfo.length === 0 && <div>Loading...</div>
        }
        {
          storage.poolInfo.sort(sortFunc).map((v, i)=>{
            if (onlyStaked) {
              if (!v.lpAmount || v.lpAmount.toString() === '0') {
                return null;
              }
            }

            if (onlyActived) {
              if (!v.allocPoint || v.allocPoint === 0) {
                return null;
              }
            }
            return <Pool poolInfo={v} pid={v.pid} key={v.pid} setTxWaiting={setTxWaiting} farmingInfo={storage.farmingInfo}/>
          })
        }
      </div>
    </React.Fragment>
  );
}
